# PolicyLense Login & Signup Audit

> Scope note: the requested project name is **PolicyLense**, while the inspected repository, UI, database filename, package metadata, and API identify themselves as **AuditWeave**. This report uses the requested title but documents the code actually present in this repository as of 2026-09-13.

## 1. Executive Summary

- **Login status:** PARTIALLY WORKING. The frontend and canonical backend contracts match in local development, but the configured PostgreSQL database was unavailable during a read-only probe, Docker URL construction is inconsistent, and the design is not production-safe.
- **Signup status:** PARTIALLY WORKING. Source tracing confirms a real SQLAlchemy insert and hashed password, but live persistence was not verified because the configured database connection failed. Weak passwords, case-variant duplicate emails, and partial-commit behavior remain possible.
- **Database connection status:** NOT VERIFIED / currently unreachable. `backend/.env` selects `postgresql+psycopg`; a non-mutating `SELECT 1` failed with `OperationalError`. Both configured application and migration URLs use PostgreSQL and resolve to the same database name/host, but the application uses `DATABASE_URL` while Alembic prefers `DIRECT_URL`.
- **Authentication architecture:** Next.js client forms -> shared `fetch` wrapper -> FastAPI JSON endpoints -> SQLAlchemy -> configured PostgreSQL. JWT HS256 access tokens are stored in browser `localStorage`; there is no refresh token, server-side session, current-user endpoint, or token revocation.
- **Overall risk level:** **CRITICAL**. A known administrator credential is embedded in source/UI, a fallback JWT signing key is committed, Docker can embed an ignored `.env`, and essentially all business APIs accept unauthenticated access.
- **Issue count:** **4 Critical / 8 High / 7 Medium / 1 Low** (20 total).

### Verification boundary

Confirmed by safe checks:

- Imported the canonical FastAPI app without running startup and enumerated its routes/dependencies.
- Instantiated `UserCreate` only in memory: malformed email was rejected; surrounding whitespace and domain case were normalized; a blank password was accepted.
- Inspected Git tracking/ignore state: `backend/.env` and `frontend/.env.local` are ignored and not tracked; `backend/.env.example` is tracked.
- Attempted a read-only database connection and `SELECT 1`; connection failed before any query or mutation.

Not runtime-tested: browser form submission, register/login HTTP responses, user insertion, startup seed behavior, and token use against a live database. Starting the canonical app would execute startup code that inserts benchmark/admin records, and registration/login would insert a user or audit log, contrary to the non-mutation constraint.

## 2. Authentication Architecture

### Frontend inventory

| File | Function/component | Purpose |
|---|---|---|
| `frontend/src/app/login/page.tsx` | `LoginPage`, `handleSubmit` | Two-stage login UI; collects email/password, calls `login`, redirects to `/dashboard`, displays thrown error text. |
| `frontend/src/app/register/page.tsx` | `RegisterPage`, `handleSubmit` | Collects required first/last name, email, and password; sends only email/password; redirects to `/login`. |
| `frontend/src/app/components/AuthSidebar.tsx` | `AuthSidebar` | Shared presentational content; no auth logic. |
| `frontend/src/lib/api.ts` | `request`, `getHeaders` | Builds the API URL, JSON headers, and optional Bearer header; parses errors/responses. |
| `frontend/src/lib/api.ts` | `login`, `register` | Calls auth endpoints; login stores token/role/email in `localStorage`; register stores nothing. |
| `frontend/src/lib/api.ts` | `isAuthenticated`, `getCurrentRole`, `isAdmin`, `getCurrentEmail`, `logoutUser` | Client-only token-presence state, untrusted role/email reads, and local logout. |
| `frontend/src/app/layout.tsx` | `RootLayout`, `handleLogout` | Client-side redirect guard for all paths except `/`, `/login`, `/register`; renders logout. |
| `frontend/src/app/{dashboard,benchmark,compare,kb,research}/page.tsx` | page effects | Repeat token-presence redirects. Other non-public pages rely only on the layout guard. |

### Backend inventory

| File | Endpoint/function | Purpose |
|---|---|---|
| `backend/main.py` | module entry point | Runs `app.main:app` on port 8000; establishes `backend/app/main.py` as canonical. |
| `backend/app/main.py` | `POST /api/auth/register` / `register` | Validates `UserCreate`, checks exact email, hashes password, inserts user and registration log. |
| `backend/app/main.py` | `POST /api/auth/login` / `login` | Case-insensitive lookup, password verification, JWT generation, login log, token response. |
| `backend/app/main.py` | `startup_populate_benchmarks` | Creates a source-known administrator account at startup if absent. |
| `backend/app/auth.py` | `get_password_hash`, `verify_password` | PBKDF2-HMAC-SHA256 with random 16-byte salt and 100,000 iterations. |
| `backend/app/auth.py` | `create_access_token` | Creates HS256 JWT containing `sub` and `exp`. |
| `backend/app/auth.py` | `get_current_user` | Strict Bearer/JWT decode followed by exact-email DB lookup; not attached to any canonical API route. |
| `backend/app/auth.py` | `get_current_user_optional` | Accepts valid JWT; otherwise silently finds/creates a hardcoded guest user. Used only by audit-create endpoints. |
| `backend/app/auth.py` | `get_current_admin_user` | Allows `admin` or `compliance_officer`; defined but unused. |
| `backend/app/schemas.py` | `UserCreate`, `UserResponse`, `Token`, `TokenData` | Auth request/response validation. |
| `backend/app/database.py` | `engine`, `SessionLocal`, `get_db` | Manually loads `backend/.env`; connects using `DATABASE_URL`. |
| `backend/app/api/routes.py` | separate `app` | Legacy zero-database/in-memory FastAPI implementation with no auth endpoints; not imported by the canonical entry point. |

### Database inventory

| Model/table | Relevant fields | Purpose |
|---|---|---|
| `User` / `users` | `id`, `email`, `password_hash`, `role`, `created_at` | Account identity, credential hash, authorization role, creation timestamp. |
| `AuditLog` / `audit_logs` | `user_id`, `action`, `timestamp` | Records registration/login actions; `user_id` has no declared foreign key. |
| `Audit` / `audits` | `created_by` FK to `users.id` | Associates generated audits with a user or auto-created guest. |

### Signup flow

```text
RegisterPage.handleSubmit
    ↓ register(email, password)
api.request -> POST /api/auth/register
    ↓ UserCreate (EmailStr + unconstrained str password)
FastAPI register
    ↓ exact-case duplicate query
get_password_hash -> User(role="user")
    ↓ SQLAlchemy add/commit/refresh
users table
    ↓ separate AuditLog add/commit
UserResponse -> frontend ignores body -> /login
```

### Login flow

```text
LoginPage.handleSubmit
    ↓ login(email, password)
api.request -> POST /api/auth/login
    ↓ UserCreate
FastAPI login
    ↓ case-insensitive SQLAlchemy user lookup
verify_password
    ↓ create_access_token({sub: stored email}, 600 minutes)
HS256 JWT + login AuditLog commit
    ↓ Token response
localStorage token/role/input email -> /dashboard
```

## 3. Signup Flow

1. `RegisterPage` owns `firstName`, `lastName`, `email`, `password`, `showPassword`, `error`, and `loading` state (`frontend/src/app/register/page.tsx:10-18`). There is no confirm-password state.
2. The first valid submit does not call the API; it sets `showPassword=true` and returns (`:20-26`). This is a password-reveal step, not email verification.
3. First name, last name, and email inputs are HTML `required`; email uses `type="email"`; password becomes required when rendered (`:85-163`). No input has a `name`, `minLength`, strength rule, or normalization handler.
4. The second submit disables the button through `loading`, preventing ordinary double clicks (`:28-38`, `:165-181`). It calls `register(email, password)`; first/last names are discarded.
5. `register` sends JSON `{email,password}` through `request("/auth/register")` (`frontend/src/lib/api.ts:140-145`). With the current local `.env.local`, the URL resolves to `POST http://127.0.0.1:8000/api/auth/register`.
6. FastAPI validates `UserCreate`: `email: EmailStr`, `password: str` (`backend/app/schemas.py:6-10`). Email syntax is checked. Pydantic/email-validator normalizes surrounding whitespace and domain case, but preserves local-part case. Password is unconstrained; direct API clients can send `""`.
7. `register` queries `User.email == user_in.email` exactly (`backend/app/main.py:83-90`). An exact duplicate returns HTTP 400 with `{"detail":"A user with this email is already registered."}`. Case variants can bypass the pre-check and PostgreSQL unique index.
8. `get_password_hash` generates 16 random salt bytes and PBKDF2-HMAC-SHA256 with 100,000 iterations, storing `salt_hex:hash_hex`, not plaintext (`backend/app/auth.py:20-24`).
9. Backend creates `User(email=user_in.email,password_hash=hashed_pwd,role="user")`, adds, commits, and refreshes (`backend/app/main.py:91-95`). The configured canonical DB is PostgreSQL via `DATABASE_URL`.
10. It then creates and separately commits an `AuditLog` (`:97-99`). Failure here occurs after the account is already persisted.
11. Success is serialized as `{"email":string,"id":int,"role":string,"created_at":datetime}` by `UserResponse`; the password hash is excluded.
12. Frontend ignores the response and redirects to `/login` (`frontend/src/app/register/page.tsx:31-35`). It creates no login/session state and shows no success message.
13. Failure text is derived from backend `detail` when JSON is parseable; a FastAPI 422 `detail` array is truthy but becomes `new Error(array)`, producing a flattened, often unhelpful string. Network and malformed-response exceptions are displayed largely verbatim.

Answers: signup is genuinely connected to the canonical backend; the backend genuinely uses the configured SQLAlchemy database; persistence is source-confirmed but not live-verified. Passwords are salted PBKDF2 hashes. Exact duplicates are handled, case variants are not. Email is syntactically validated and partly normalized, not canonicalized. Password strength and confirmation are absent. No mock signup exists in the canonical app, but the two-stage UI implies an email step it does not perform. First/last name functionality is effectively stubbed because those values are never sent or stored.

## 4. Login Flow

1. `LoginPage` initializes email and password with a real source-known administrator credential (`frontend/src/app/login/page.tsx:12-13`). The password initially exists in state while its field is hidden.
2. The first submit only displays the password field (`:18-24`). Despite “Sending code”/magic-link copy, no code or link API exists.
3. The second submit sets loading, calls `login`, redirects to `/dashboard` on any successful JSON response, and displays thrown errors (`:26-36`).
4. `login` sends JSON `{email,password}` to `/auth/login` (`frontend/src/lib/api.ts:127-131`). Local resolved URL: `POST http://127.0.0.1:8000/api/auth/login`.
5. FastAPI reuses `UserCreate`, so email syntax is validated but password has no constraints (`backend/app/main.py:103-104`; `schemas.py:6-10`).
6. Lookup is case-insensitive: `lower(User.email) == user_in.email.lower()` (`backend/app/main.py:105`). It uses the same `get_db`/`DATABASE_URL` engine as signup.
7. A missing user and wrong password both return HTTP 401 with identical “Incorrect email or password” (`:106-110`), appropriately avoiding username enumeration in this response.
8. `verify_password` parses the salt/hash and recomputes PBKDF2-HMAC-SHA256 (`backend/app/auth.py:26-37`). It compares bytes with `==`, not a documented constant-time primitive.
9. `create_access_token` signs HS256 with `JWT_SECRET` or a committed fallback and adds `exp`; login provides a 600-minute/10-hour expiration (`backend/app/auth.py:13-15,39-47`; `main.py:112-115`). Claims are only `sub` (stored email) and `exp`; no `iat`, `nbf`, `iss`, `aud`, `jti`, session ID, or role.
10. Login separately commits an `AuditLog`; a DB failure here prevents the token response even though credential verification/token creation succeeded (`backend/app/main.py:117-119`).
11. Response is `{"access_token":string,"token_type":"bearer","role":string,"email":string}` (`:121-126`).
12. Frontend stores token, response role (defaulting to `user`), and the submitted—not returned—email in persistent `localStorage` (`frontend/src/lib/api.ts:132-136`).
13. `getHeaders` adds `Authorization: Bearer <token>` to shared-wrapper requests (`:5-14`). `createAuditWithFile` bypasses that wrapper and sends no Authorization header (`:94-108`).
14. Page refresh preserves values because they are in `localStorage`. `isAuthenticated` checks only token presence, not signature/expiry (`:18-20`). Expired/malformed tokens leave the UI “authenticated”; API 401s are not centrally handled. On optional-auth audit endpoints, invalid/expired tokens are silently downgraded to guest.
15. Logout only deletes three local keys and redirects (`frontend/src/lib/api.ts:37-42`; `layout.tsx:31-36`). There is no backend logout endpoint, denylist, refresh token, or revocation; a copied token works until expiration.

There is no fake fallback inside canonical login. The magic-link path is a UI-only stub. Login state survives refresh but is not validated. Bearer construction is correct for wrapper-based requests; backend enforcement is largely absent.

## 5. Frontend ↔ Backend API Contract

### Register

| Stage | Actual contract |
|---|---|
| Frontend sends | `{"email": string, "password": string}` |
| Backend expects | `UserCreate { email: EmailStr, password: str }` |
| Backend returns | `UserResponse { email: EmailStr, id: int, role: str, created_at: datetime }` |
| Frontend expects | No typed fields; merely requires an OK response containing parseable JSON, ignores body, then redirects. |
| Verdict | **PARTIAL MATCH** — request matches; response is intentionally ignored and names shown as required UI fields are not part of the contract. |

### Login

| Stage | Actual contract |
|---|---|
| Frontend sends | `{"email": string, "password": string}` |
| Backend expects | `UserCreate { email: EmailStr, password: str }` |
| Backend returns | `Token { access_token: str, token_type: str, role: str, email: str }` |
| Frontend expects | Untyped object; conditionally reads `access_token`, reads `role`, ignores `token_type`/returned `email`. |
| Verdict | **PARTIAL MATCH** — normal response works, but frontend redirects even if a malformed 2xx response lacks a token. |

FastAPI validation errors are `{"detail":[...]}`. The frontend error wrapper assumes `detail` is suitable for `Error(string)`, so structured validation feedback is not correctly rendered.

## 6. Database Authentication Model

Canonical table: **`users`** (`backend/app/models.py:6-13`; migration `:56-65`).

| Column | Type | Nullable | Unique | Indexed | Default | Purpose |
|---|---|---:|---:|---:|---|---|
| `id` | Integer | No (PK) | PK | Yes | DB-generated | User identifier. |
| `email` | String, no declared max length | No | Yes | Yes | None | Login identity. |
| `password_hash` | String, no declared max length | No | No | No | None | `salt_hex:pbkdf2_hash_hex`. |
| `role` | String | Yes in migration | No | No | Python-side `"user"` | `user`, `admin`, or `compliance_officer` by convention only. |
| `created_at` | DateTime | Yes in migration | No | No | Python-side UTC now | Account creation time. |

There is no DB check constraint for roles, no case-insensitive/canonical-email constraint, no account status, verification flag, password-change timestamp, failed-login counter, or session table.

Actual database selection:

- Local canonical auth uses `backend/app/database.py` and the ignored `backend/.env` `DATABASE_URL`, currently `postgresql+psycopg` (secret/host values intentionally omitted).
- Alembic uses `DIRECT_URL` first and `DATABASE_URL` second (`backend/migrations/env.py:36-39,58-62`). The current two URLs were safely confirmed to target the same host/database, but this is not enforced and future divergence could migrate one DB while the app authenticates against another.
- `alembic.ini` falls back to `sqlite:///./AuditWeave.db`; README also describes SQLite. These are not selected while the current `.env` PostgreSQL variables exist.
- Docker Compose declares SQLite, but `backend/.env` may be copied into the image and the manual loader overwrites process environment, so the Compose value can be ignored.
- `backend/app/api/routes.py` is an alternate in-memory app with no users/auth; it is noncanonical unless launched explicitly.

## 7. Token / Session Handling

- Type: signed JWT access token, HS256.
- Claims: `sub=<stored user email>` and `exp=<UTC expiration>` only.
- Lifetime: 600 minutes (10 hours).
- Signing input: `JWT_SECRET`; unsafe committed fallback if absent.
- Storage: persistent browser `localStorage` keys `auditweave_token`, `auditweave_role`, `auditweave_email`.
- Transport: `Authorization: Bearer ...` on calls through `request`; absent from direct file-upload and hardcoded report URLs.
- Validation: `get_current_user` decodes signature/expiration and fetches user, but no route uses it. Optional validation swallows every exception and falls back to guest.
- Refresh: token remains stored and the UI regards it as valid. No server validation/current-user fetch occurs.
- Expiry: frontend does not decode or proactively remove it; generic API errors result. Optional endpoints treat it as guest.
- Logout: local deletion only. It does not invalidate the JWT server-side.
- Security assessment: unsuitable for production due to XSS-accessible token storage, hardcoded/fallback secret paths, long lifetime, no rotation/revocation, and missing route enforcement.

## 8. Protected Routes

Frontend `RootLayout` redirects every path except `/`, `/login`, and `/register` based only on token presence (`frontend/src/app/layout.tsx:20-29`). This includes documentation and contact pages. Several pages repeat the same check. It is a navigation control, not a security boundary, and may briefly render children before the effect runs.

Runtime route enumeration confirmed:

- `/api/audit`, `/api/audit/file`, `/api/audit/batch`: use `get_current_user_optional`; no token, invalid token, or expired token becomes an auto-created guest.
- History, detail, deletion, reports, dashboard, benchmarks, leaderboard, comparison, KB, copilot, rewrite, and research endpoints: no current-user dependency at all.
- `get_current_user` and `get_current_admin_user`: attached to **zero** canonical routes.
- No ownership filtering exists. Any caller can list, view, download, or delete any audit by ID.
- Frontend-declared `/api/admin/*` endpoints do not exist in canonical FastAPI, and no admin page exists.

Therefore protected APIs are **not actually protected**. Frontend redirects are bypassed by direct HTTP calls.

## 9. Role & Admin Authorization

- Available role strings by comment/check: `user`, `admin`, `compliance_officer`.
- Signup always explicitly sets `role="user"`; `UserCreate` has no role field. Extra JSON fields are ignored by default Pydantic behavior, so direct role assignment through signup was not found.
- Startup creates an administrator with source-known email/password if that exact email is absent (`backend/app/main.py:66-76`). Login UI is prefilled with matching credentials.
- `get_current_admin_user` treats admin and compliance officer identically, but it is unused.
- No canonical admin endpoints exist. Frontend helper methods for stats/users/role changes/deletion/logs call nonexistent routes.
- Client `auditweave_role` can be edited in `localStorage`; `isAdmin` trusts it and recognizes only `admin`, not `compliance_officer`. It is currently unused, so no confirmed backend privilege escalation follows from it.
- A normal user—or a completely unauthenticated caller—can access all existing business APIs because those APIs lack strict authorization.

## 10. Issues Found

### AUTH-001 — Publicly embedded administrator credentials

Severity: CRITICAL

Area: Security

Status: Confirmed

File: `frontend/src/app/login/page.tsx`; `backend/app/main.py`

Lines: 12-13; 66-76

Related function/component: `LoginPage`; `startup_populate_benchmarks`

Current behavior: The login form is prefilled with the same source-known credential used to seed an administrator on every startup.

Expected behavior: Administrator credentials must be provisioned out-of-band, unique per environment, rotated, and never shipped to clients.

Why this is a problem: Anyone with the source or login page can authenticate as administrator wherever the seeded credential remains unchanged.

How to reproduce:
1. Open `/login` and inspect the prefilled fields.
2. Compare with startup admin creation.
3. Submit against an environment where the seed account exists.

Recommended fix: Remove all embedded credentials, disable automatic known-password admin creation, rotate existing credentials, and implement secure bootstrap/invitation.

Files likely requiring changes:
- `frontend/src/app/login/page.tsx`
- `backend/app/main.py`

--------------------------------------------------

### AUTH-002 — Business APIs lack backend authentication and authorization

Severity: CRITICAL

Area: Backend

Status: Confirmed

File: `backend/app/main.py`; `backend/app/auth.py`

Lines: 242-325, 411-920; 49-101

Related function/component: canonical API routes; `get_current_user_optional`

Current behavior: No route uses strict user/admin dependencies. Three create routes downgrade absent/invalid JWTs to a guest; all other data APIs are wholly unauthenticated.

Expected behavior: Sensitive routes must require validated identity, enforce ownership, and apply server-side role checks.

Why this is a problem: Direct callers can read, create, download, rewrite, research, and delete data without logging in.

How to reproduce:
1. Start an environment with a safe test DB.
2. Call a listed API without Authorization.
3. Observe it is not rejected with 401 (subject to resource existence/input).

Recommended fix: Define an authorization matrix; attach strict dependencies; scope queries by owner; reserve guest access only for explicitly public routes.

Files likely requiring changes:
- `backend/app/main.py`
- `backend/app/auth.py`

--------------------------------------------------

### AUTH-003 — Docker build can embed `.env` secrets and override deployment configuration

Severity: CRITICAL

Area: Configuration

Status: Confirmed

File: `backend/Dockerfile`; `backend/app/database.py`

Lines: 13; 5-15

Related function/component: Docker `COPY`; module-level `.env` loader

Current behavior: No `backend/.dockerignore` exists, Docker copies the whole backend including ignored `.env`, and the loader unconditionally assigns its values into `os.environ`.

Expected behavior: Secrets must be excluded from image contexts and runtime-injected environment values must take precedence.

Why this is a problem: Database/JWT/API credentials can persist in image layers and bundled `.env` can override Compose/orchestrator settings, connecting auth to an unintended database.

How to reproduce:
1. Inspect Docker build context exclusions (none exist).
2. Observe `COPY . .`.
3. Observe unconditional `os.environ[key]=value`.

Recommended fix: Add appropriate Docker exclusions, use a standard non-overriding environment loader, rotate any secrets ever built, and scan image history.

Files likely requiring changes:
- `backend/.dockerignore`
- `backend/app/database.py`
- deployment secret configuration

--------------------------------------------------

### AUTH-004 — JWT has committed fallback and Docker signing secrets

Severity: CRITICAL

Area: Security

Status: Confirmed

File: `backend/app/auth.py`; `docker-compose.yml`

Lines: 13; 10-13

Related function/component: `SECRET_KEY`; backend service environment

Current behavior: Missing `JWT_SECRET` silently activates a committed static fallback; Compose also contains a static signing value.

Expected behavior: Startup must fail without a strong environment-managed secret; secrets must not be committed.

Why this is a problem: A known signing key permits forged JWTs. Although current routes are mostly open, future/current strict dependencies would trust forged identities.

How to reproduce:
1. Inspect both variable definitions.
2. Run without a secure external `JWT_SECRET`.
3. Observe tokens are still issued.

Recommended fix: Remove fallbacks/static values, require validated high-entropy secret management, rotate keys, and support key rotation.

Files likely requiring changes:
- `backend/app/auth.py`
- `docker-compose.yml`

--------------------------------------------------

### AUTH-005 — Access token is persisted in JavaScript-readable localStorage

Severity: HIGH

Area: Frontend

Status: Confirmed

File: `frontend/src/lib/api.ts`

Lines: 10-12, 18-20, 132-136

Related function/component: `getHeaders`; `isAuthenticated`; `login`

Current behavior: JWT, role, and email persist in `localStorage`.

Expected behavior: Prefer an appropriately configured Secure, HttpOnly, SameSite cookie/session design or a carefully threat-modeled short-lived in-memory token design.

Why this is a problem: Any successful same-origin script injection can read and exfiltrate the bearer token; it also survives browser restarts.

How to reproduce:
1. Log in.
2. Inspect application local storage.
3. Observe all auth values are JavaScript-readable.

Recommended fix: Redesign token delivery/storage with XSS and CSRF controls; avoid trusting stored role/email.

Files likely requiring changes:
- `frontend/src/lib/api.ts`
- `backend/app/main.py`
- `backend/app/auth.py`

--------------------------------------------------

### AUTH-006 — Logout does not revoke tokens

Severity: HIGH

Area: Security

Status: Confirmed

File: `frontend/src/lib/api.ts`; `frontend/src/app/layout.tsx`

Lines: 37-42; 31-36

Related function/component: `logoutUser`; `handleLogout`

Current behavior: Logout removes local keys only. No backend logout/session/revocation endpoint exists; issued JWTs remain valid for 10 hours.

Expected behavior: Logout should invalidate the active server-side session/refresh credential and minimize access-token lifetime.

Why this is a problem: Stolen/copied tokens continue working after the user logs out.

How to reproduce:
1. Copy an issued token.
2. Log out in the UI.
3. Reuse the copied token before expiry.

Recommended fix: Implement session/refresh-token revocation or denylisting appropriate to the architecture and shorten access-token lifetime.

Files likely requiring changes:
- `frontend/src/lib/api.ts`
- `backend/app/auth.py`
- `backend/app/main.py`

--------------------------------------------------

### AUTH-007 — Docker frontend auth URL is build/runtime inconsistent and may duplicate `/api`

Severity: HIGH

Area: Configuration

Status: Confirmed

File: `frontend/src/lib/api.ts`; `docker-compose.yml`; `frontend/Dockerfile`

Lines: 1-2; 24-25; 8-9,17-20

Related function/component: `API_BASE`; frontend image build

Current behavior: Code always appends `/api`, while Compose provides a value already ending `/api`, yielding `/api/api` if honored. `NEXT_PUBLIC_*` is normally compiled during `npm run build`, but Compose supplies it only to the runtime container. With no `.dockerignore`, local `.env.local` may instead be baked at build.

Expected behavior: One canonical base convention must be supplied at build time for client code, producing exactly one `/api`.

Why this is a problem: Containerized register/login can call nonexistent endpoints or unexpectedly target a developer-local URL.

How to reproduce:
1. Concatenate the Compose value with the source suffix.
2. Inspect that build stage has no declared build argument.
3. Inspect the resulting browser request in a Docker deployment.

Recommended fix: Normalize base URL ownership and explicitly inject validated build-time public configuration.

Files likely requiring changes:
- `frontend/src/lib/api.ts`
- `docker-compose.yml`
- `frontend/Dockerfile`
- `frontend/.dockerignore`

--------------------------------------------------

### AUTH-008 — Registration permits case-variant duplicate identities

Severity: HIGH

Area: Database

Status: Confirmed

File: `backend/app/main.py`; `backend/app/models.py`

Lines: 85,105; 10

Related function/component: `register`; `login`; `User.email`

Current behavior: Registration and the unique index use stored string case; login searches case-insensitively. Email domain is normalized but local-part case is preserved.

Expected behavior: Apply one canonical email representation consistently and enforce uniqueness on that representation in the database.

Why this is a problem: `User@example.com` and `user@example.com` can coexist, while login may nondeterministically choose one account, creating identity ambiguity.

How to reproduce:
1. Register an address with mixed-case local part.
2. Register the same address with different local-part case.
3. Attempt login using either case.

Recommended fix: Canonicalize before lookup/storage and add a matching case-insensitive DB constraint/index after data cleanup.

Files likely requiring changes:
- `backend/app/main.py`
- `backend/app/models.py`
- schema migration (future authorized work)

--------------------------------------------------

### AUTH-009 — Backend accepts empty and arbitrarily weak passwords

Severity: HIGH

Area: Backend

Status: Confirmed

File: `backend/app/schemas.py`; `frontend/src/app/register/page.tsx`

Lines: 9-10; 144-160

Related function/component: `UserCreate`; `RegisterPage`

Current behavior: Password is an unconstrained string. An in-memory validation test confirmed `password=""` is accepted by the backend schema. Browser `required` is bypassable; no strength validation exists.

Expected behavior: Enforce a documented server-side password policy and breached-password controls as appropriate.

Why this is a problem: Direct clients can create accounts with empty/trivial passwords.

How to reproduce:
1. Construct valid JSON with a valid email and blank password.
2. Submit directly to register against a safe test DB.
3. Schema validation will accept it.

Recommended fix: Add server-side length/quality validation and mirror it in accessible client feedback.

Files likely requiring changes:
- `backend/app/schemas.py`
- `frontend/src/app/register/page.tsx`

--------------------------------------------------

### AUTH-010 — Login has no rate limiting or brute-force controls

Severity: HIGH

Area: Security

Status: Confirmed

File: `backend/app/main.py`

Lines: 103-126

Related function/component: `login`

Current behavior: Every syntactically valid login attempt performs lookup/hash verification without per-account/IP throttling, lockout, delay, or abuse monitoring.

Expected behavior: Layer rate limiting, adaptive throttling, monitoring, and safe account protections.

Why this is a problem: Online password guessing and credential stuffing are unrestricted at application level.

How to reproduce:
1. Repeatedly submit wrong passwords.
2. Observe no code path increments counters or returns 429.

Recommended fix: Add gateway and application-level throttling with secure operational monitoring.

Files likely requiring changes:
- `backend/app/main.py`
- deployment/gateway configuration

--------------------------------------------------

### AUTH-011 — File-upload requests omit the logged-in Bearer token

Severity: HIGH

Area: Frontend

Status: Confirmed

File: `frontend/src/lib/api.ts`; `backend/app/main.py`

Lines: 94-108; 279-312

Related function/component: `createAuditWithFile`; `audit_policy_file`

Current behavior: The direct multipart `fetch` does not call `getHeaders`. Backend optional auth therefore associates a logged-in user's file audit with guest.

Expected behavior: Authenticated multipart requests should include the same Bearer credential and backend should require/validate it when ownership matters.

Why this is a problem: Ownership/audit attribution is incorrect and authorization cannot work consistently.

How to reproduce:
1. Log in and upload a policy file.
2. Inspect the request headers: Authorization is absent.
3. Backend resolves the guest user.

Recommended fix: Use a shared authenticated fetch path for multipart requests and require strict identity server-side.

Files likely requiring changes:
- `frontend/src/lib/api.ts`
- `backend/app/main.py`

--------------------------------------------------

### AUTH-012 — Duplicate-email race and registration are not transactionally handled

Severity: HIGH

Area: Backend

Status: Confirmed

File: `backend/app/main.py`

Lines: 85-101

Related function/component: `register`

Current behavior: Check-then-insert can race; the unique index prevents an exact duplicate but the resulting integrity exception is unhandled. User and audit log use separate commits, so log failure returns an error after account creation.

Expected behavior: Treat registration atomically, catch/rollback integrity/database errors, and return stable conflict/service errors.

Why this is a problem: Users can see failure despite an existing new account; concurrent duplicates produce 500 and leave sessions needing rollback.

How to reproduce:
1. Submit the same new email concurrently against a test DB.
2. Or induce audit-log commit failure after user commit.
3. Observe unhandled/inconsistent result.

Recommended fix: Use one transaction and database uniqueness as authoritative; catch and map integrity failures without leaking details.

Files likely requiring changes:
- `backend/app/main.py`

--------------------------------------------------

### AUTH-013 — Token presence is mistaken for a valid authenticated session

Severity: MEDIUM

Area: Frontend

Status: Confirmed

File: `frontend/src/lib/api.ts`; `frontend/src/app/layout.tsx`

Lines: 18-35; 20-29

Related function/component: `isAuthenticated`; `RootLayout`

Current behavior: Any nonempty token string unlocks client navigation. No current-user endpoint, decode, expiry check, startup validation, or global 401 cleanup exists.

Expected behavior: Resolve session state from a validated server identity and handle expiration consistently.

Why this is a problem: Malformed/expired tokens survive refresh and produce a misleading authenticated UI.

How to reproduce:
1. Set `auditweave_token` to arbitrary text.
2. Refresh a protected route.
3. Observe the client treats it as authenticated.

Recommended fix: Add validated session bootstrap/current-user handling and centralized unauthorized response behavior.

Files likely requiring changes:
- `frontend/src/lib/api.ts`
- `frontend/src/app/layout.tsx`
- `backend/app/main.py`

--------------------------------------------------

### AUTH-014 — Magic-link/one-time-code UI is a nonfunctional stub

Severity: MEDIUM

Area: Frontend

Status: Confirmed

File: `frontend/src/app/login/page.tsx`

Lines: 21-24,132-149,164-169

Related function/component: `LoginPage.handleSubmit`

Current behavior: UI says it will send a code/magic link, but submission merely reveals the password field; no corresponding API exists.

Expected behavior: Implement a complete secure passwordless flow or label the step accurately as password login.

Why this is a problem: Users receive a false security/functionality promise and may wait for a message never sent.

How to reproduce:
1. Keep the default password-hidden mode.
2. Submit a valid email.
3. Observe only a password field appears.

Recommended fix: Remove misleading controls/copy until a complete tokenized, expiring passwordless flow exists.

Files likely requiring changes:
- `frontend/src/app/login/page.tsx`
- backend auth files if passwordless login is implemented

--------------------------------------------------

### AUTH-015 — Signup profile/confirmation UI is disconnected

Severity: MEDIUM

Area: Frontend

Status: Confirmed

File: `frontend/src/app/register/page.tsx`; `frontend/src/lib/api.ts`

Lines: 12-15,85-163; 140-145

Related function/component: `RegisterPage`; `register`

Current behavior: Required first/last names are collected but never sent/stored; confirm-password is absent; success redirects without message or authentication.

Expected behavior: Collect only modeled data (or persist profile fields), confirm the password client-side, and clearly communicate post-registration state.

Why this is a problem: Required user effort is discarded, typo risk is high, and the workflow appears more complete than it is.

How to reproduce:
1. Enter any two names.
2. Inspect the request payload.
3. Observe it contains only email/password.

Recommended fix: Align UI/schema/product requirements and provide explicit success/verification behavior.

Files likely requiring changes:
- `frontend/src/app/register/page.tsx`
- `frontend/src/lib/api.ts`
- backend model/schema only if names are required

--------------------------------------------------

### AUTH-016 — Password hashing work factor/comparison need production hardening

Severity: MEDIUM

Area: Security

Status: Confirmed

File: `backend/app/auth.py`

Lines: 20-37

Related function/component: `get_password_hash`; `verify_password`

Current behavior: PBKDF2-HMAC-SHA256 uses 100,000 iterations and compares derived bytes with `==`; stored hashes contain no algorithm/version/work-factor metadata.

Expected behavior: Use a maintained password-hashing framework and current calibrated parameters, constant-time verification, versioned hashes, and rehash-on-login.

Why this is a problem: The cost is weak by current common guidance and cannot be upgraded gracefully per stored record; comparison is not explicitly constant-time.

How to reproduce:
1. Inspect hash construction and stored format.
2. Observe fixed iteration count and raw equality.

Recommended fix: Adopt a modern password KDF/library and migration-compatible rehash policy after benchmarking.

Files likely requiring changes:
- `backend/app/auth.py`

--------------------------------------------------

### AUTH-017 — CORS supports only one local hostname and a placeholder production origin

Severity: MEDIUM

Area: Configuration

Status: Confirmed

File: `backend/app/main.py`

Lines: 34-43

Related function/component: `CORSMiddleware`

Current behavior: Allows `http://localhost:3000` and a placeholder Vercel URL; credentials, all methods, and all headers are allowed. `http://127.0.0.1:3000` and real deployments are absent.

Expected behavior: Explicitly configure exact trusted origins per environment.

Why this is a problem: Current localhost frontend works only when opened as `localhost`; alternate local/production origins fail browser preflight.

How to reproduce:
1. Open frontend at `http://127.0.0.1:3000`.
2. Submit login to port 8000.
3. Browser blocks the response due to origin mismatch.

Recommended fix: Drive a narrow allowlist from validated deployment configuration and test preflight.

Files likely requiring changes:
- `backend/app/main.py`
- deployment configuration

--------------------------------------------------

### AUTH-018 — OAuth2 metadata does not match the JSON login endpoint

Severity: MEDIUM

Area: Backend

Status: Confirmed

File: `backend/app/auth.py`; `backend/app/main.py`

Lines: 17-18; 103-104

Related function/component: `oauth2_scheme`; `login`

Current behavior: `OAuth2PasswordBearer` advertises a token URL, but that endpoint accepts JSON `UserCreate`, not OAuth2 password form fields (`username`, `password`).

Expected behavior: OpenAPI security metadata and token endpoint request format should agree.

Why this is a problem: Swagger/OpenAPI OAuth2 authorization clients will submit the wrong content type/field and receive validation errors.

How to reproduce:
1. Open `/docs` and use Authorize/password flow.
2. Client submits OAuth2 form data.
3. JSON endpoint rejects it.

Recommended fix: Either implement the OAuth2 form contract or describe/use HTTP Bearer plus a separate JSON login accurately.

Files likely requiring changes:
- `backend/app/auth.py`
- `backend/app/main.py`

--------------------------------------------------

### AUTH-019 — Role/admin client exists without canonical server implementation

Severity: MEDIUM

Area: Backend

Status: Confirmed

File: `frontend/src/lib/api.ts`; `backend/app/auth.py`; `backend/app/main.py`

Lines: 23-30,151-184; 95-101; canonical route set

Related function/component: `isAdmin`; admin API helpers; `get_current_admin_user`

Current behavior: Frontend declares admin calls and trusts stored role, while canonical backend exposes no `/api/admin/*` routes and never uses its role guard.

Expected behavior: Remove dead surface or implement authenticated, role-checked endpoints and UI based on server-confirmed identity.

Why this is a problem: Admin functions return 404; documentation/design imply RBAC that is not operational. Future UI use of editable local role would be unsafe.

How to reproduce:
1. Enumerate canonical FastAPI routes.
2. Call an `/api/admin/*` helper target.
3. Observe no matching backend route.

Recommended fix: Establish a single implemented RBAC contract and test ordinary/admin/compliance-officer access server-side.

Files likely requiring changes:
- `frontend/src/lib/api.ts`
- `backend/app/main.py`
- `backend/app/auth.py`

--------------------------------------------------

### AUTH-020 — README names the wrong JWT environment variable

Severity: LOW

Area: Configuration

Status: Confirmed

File: `README.md`; `backend/app/auth.py`; `backend/.env.example`

Lines: 171-173; 13; 3

Related function/component: setup instructions; `SECRET_KEY`

Current behavior: README instructs `SECRET_KEY`, but code reads `JWT_SECRET`; the example correctly says `JWT_SECRET`.

Expected behavior: Documentation and runtime variable names must match.

Why this is a problem: Following README can silently activate the known fallback signing key.

How to reproduce:
1. Configure only `SECRET_KEY` per README.
2. Import/run auth.
3. Code does not read that variable.

Recommended fix: Correct documentation and fail startup when `JWT_SECRET` is missing.

Files likely requiring changes:
- `README.md`
- `backend/app/auth.py`

--------------------------------------------------

## 11. Security Findings

| Finding | Severity | Evidence | Assessment |
|---|---|---|---|
| Hardcoded administrator password | CRITICAL | `backend/app/main.py:66-76`, `frontend/src/app/login/page.tsx:12-13` | Confirmed; value intentionally omitted here. |
| Hardcoded/fallback JWT signing secrets | CRITICAL | `backend/app/auth.py:13`, `docker-compose.yml:11` | Confirmed; values intentionally omitted. |
| Potential secrets embedded in Docker image | CRITICAL | no `.dockerignore`; `backend/Dockerfile:13` | Confirmed build behavior when local `.env` is present. |
| Auth bypass / guest downgrade | CRITICAL | `backend/app/main.py` dependencies; `backend/app/auth.py:69-93` | Confirmed through source and route enumeration. |
| Hardcoded guest account password | HIGH | `backend/app/auth.py:82-92` | Confirmed; value intentionally omitted. Guest is created during an unauthenticated request. |
| Persistent bearer token accessible to JS | HIGH | `frontend/src/lib/api.ts:10-12,132-136` | Confirmed. |
| No brute-force controls | HIGH | `backend/app/main.py:103-126` | Confirmed in repository; external gateway controls not verified. |
| No logout revocation | HIGH | no backend logout route; local deletion only | Confirmed. |
| Weak password acceptance | HIGH | `backend/app/schemas.py:9-10` plus safe in-memory test | Confirmed. |

Sensitive environment files: `backend/.env` and `frontend/.env.local` are ignored by Git and were not tracked. `backend/.env.example` is intentionally tracked and contains placeholders only. This protects Git commits but does not protect Docker contexts; `.gitignore` is not `.dockerignore`. No real secret value is reproduced in this report.

## 12. Dead / Duplicate / Legacy Auth Code

- **Canonical implementation:** root `package.json` runs `backend/main.py`; that imports `backend/app/main.py:app`, which contains SQLAlchemy-backed register/login.
- **Legacy/conflicting FastAPI app:** `backend/app/api/routes.py` defines a second `app`, describes itself as “Zero-database,” stores audits in `AUDIT_STORE`, allows wildcard CORS, and has no login/register. It is not imported or mounted by the canonical app. Launching it directly would make frontend auth 404.
- **Unused strict auth:** `get_current_user` is defined but no canonical endpoint depends on it.
- **Unused admin auth:** `get_current_admin_user` is defined but no canonical endpoint depends on it.
- **Missing backend for frontend client:** `getAdminStats`, `getAdminUsers`, `updateUserRole`, `deleteUser`, `getAdminCompanies`, `getAdminAudits`, `deleteAdminAudit`, and `getAdminLogs` target absent routes.
- **Unused/trust-based frontend role helpers:** `getCurrentRole`/`isAdmin` have no current UI caller; `isAdmin` excludes `compliance_officer` although the backend guard includes it.
- **Fake passwordless path:** login magic-link/one-time-code labels only toggle the password field.
- **Duplicated client guards:** layout protection is repeated in dashboard, benchmark, compare, KB, and research pages.
- **Minor duplicate statement:** `setIsAuth(false)` occurs twice in `RootLayout.handleLogout` (`frontend/src/app/layout.tsx:33-34`).

## 13. Login Test Matrix

| ID | Scenario | Frontend Expected | Backend Expected | Current Result | Status |
|---|---|---|---|---|---|
| L-01 | Correct credentials | Store token, go dashboard | 200 Token response, log event | Source path matches; not live-tested because DB unavailable | NOT VERIFIED |
| L-02 | Unknown email | Show generic error | 401 identical generic message | Source-confirmed | CONFIRMED |
| L-03 | Wrong password | Show generic error | 401 identical generic message | Source-confirmed; no email/password distinction | CONFIRMED |
| L-04 | Invalid email | Browser/schema error | Browser blocks normal form; direct API 422 | Schema tested in memory; UI not browser-tested | PARTIAL |
| L-05 | Blank email | Browser blocks submit | Direct API 422 | Source-confirmed | CONFIRMED |
| L-06 | Blank password | Browser blocks once shown | Backend schema accepts, lookup/verify fails unless blank-hash account exists | Blank schema acceptance tested | CONFIRMED |
| L-07 | Backend offline | Useful service error | No response | Browser likely shows raw “Failed to fetch” | LIKELY |
| L-08 | DB offline | Useful retry-safe error | Controlled 503 | Configured DB probe failed; endpoint would produce unhandled server error | PARTIAL |
| L-09 | Expired token | Clear session, redirect login | 401 on protected API | Client remains “authenticated”; optional endpoints downgrade to guest | CONFIRMED |
| L-10 | Malformed token | Clear session, redirect login | 401 | Client trusts presence; optional endpoints downgrade to guest | CONFIRMED |
| L-11 | Malformed 2xx login response | Reject login | Contract violation | Frontend redirects even without `access_token` if JSON parses | CONFIRMED |
| L-12 | Repeated guesses | Throttle/429 | Rate-limit | No repository control found | CONFIRMED |

## 14. Signup Test Matrix

| ID | Scenario | Frontend Expected | Backend Expected | Current Result | Status |
|---|---|---|---|---|---|
| S-01 | Valid signup | Success then login/verification | Insert hash, log, return UserResponse | Source path correct; persistence not live-tested | NOT VERIFIED |
| S-02 | Exact duplicate email | Show conflict | 400 descriptive detail | Correct in sequential source path | CONFIRMED |
| S-03 | Case-variant duplicate | Show conflict | Canonical uniqueness | May insert second row; login identity becomes ambiguous | CONFIRMED |
| S-04 | Invalid email | Browser/useful validation | 422 | Email schema rejection tested; structured UI message poor | PARTIAL |
| S-05 | Empty email | Browser blocks | 422 | Source-confirmed | CONFIRMED |
| S-06 | Blank password | Browser blocks | Reject | Backend schema accepts blank | CONFIRMED |
| S-07 | Weak password | Explain policy | Reject | Accepted; no policy exists | CONFIRMED |
| S-08 | Password mismatch | Explain mismatch | Reject | No confirm-password field or check | CONFIRMED |
| S-09 | DB failure | Stable retry message/no partial account | Rollback/503 | Unhandled; current read-only connection failed | PARTIAL |
| S-10 | Audit-log failure | Do not report total failure after creation | Atomic rollback | User commit occurs first, so partial success possible | CONFIRMED |
| S-11 | Backend failure | Useful service error | Controlled error | Raw/generic fetch error likely | LIKELY |
| S-12 | First/last name | Persist or omit field | Matching schema/model | Required values are discarded | CONFIRMED |

## 15. Priority Fix Order

### P0 - Critical

1. Remove and rotate all known admin, guest, and JWT secrets; replace startup admin seeding with secure provisioning.
2. Enforce strict backend authentication, ownership, and role authorization on every sensitive API; do not silently downgrade invalid tokens.
3. Exclude secrets from Docker contexts/images and stop `.env` from overriding injected runtime configuration.

### P1 - High

1. Enforce strong server-side passwords and consistent canonical email uniqueness.
2. Replace persistent JS-readable bearer storage with a threat-modeled session/token design; implement expiry and revocation/logout.
3. Add brute-force controls and atomic database error handling.
4. Fix Docker/build-time API URL construction and authenticated multipart calls.

### P2 - Medium

1. Implement server-validated current-user/session bootstrap and centralized 401 behavior.
2. Remove or implement magic-link, profile-name, admin/RBAC, and OAuth2 contract surfaces.
3. Harden password hashing parameters/versioning and configure exact CORS origins per environment.

### P3 - Low

1. Correct README environment naming and minor duplicated client state code.

## 16. Exact Files Involved

| File | Role in Auth | Current Problem | Needs Change? |
|---|---|---|---:|
| `frontend/src/app/login/page.tsx` | Login UI/redirect | Embedded admin credential; fake magic-link flow | Yes |
| `frontend/src/app/register/page.tsx` | Signup UI/redirect | Names discarded; no confirmation/strength/success state | Yes |
| `frontend/src/app/components/AuthSidebar.tsx` | Shared auth presentation | No auth logic problem found | No |
| `frontend/src/lib/api.ts` | API, tokens, logout, admin helpers | localStorage, stale auth, multipart omission, untyped contracts, dead admin calls | Yes |
| `frontend/src/app/layout.tsx` | Client guard/logout | Token-presence-only guard; duplicate state update | Yes |
| `frontend/src/app/dashboard/page.tsx` | Repeated client guard | Not a security boundary | Likely |
| `frontend/src/app/benchmark/page.tsx` | Repeated client guard | Not a security boundary | Likely |
| `frontend/src/app/compare/page.tsx` | Repeated client guard | Not a security boundary | Likely |
| `frontend/src/app/kb/page.tsx` | Repeated client guard | Not a security boundary | Likely |
| `frontend/src/app/research/page.tsx` | Repeated client guard | Not a security boundary | Likely |
| `frontend/.env.local` | Current local API host | Correct local suffix convention; ignored and untracked | Environment-specific |
| `frontend/Dockerfile` | Production frontend build | Public API variable not injected at build; local env can enter context | Yes |
| `backend/main.py` | Canonical backend launcher | Correctly points to canonical app | No |
| `backend/app/main.py` | Register/login/CORS/API routes | Embedded admin; partial commits; nearly all routes open | Yes |
| `backend/app/auth.py` | Hash/JWT/dependencies/roles/guest | Static secret fallback, long JWT, guest downgrade, unused guards | Yes |
| `backend/app/schemas.py` | Auth validation/contracts | Unconstrained password | Yes |
| `backend/app/models.py` | User table model | Nullable/unconstrained role; case-sensitive identity | Yes |
| `backend/app/database.py` | DB engine/env load | Local `.env` overrides runtime environment | Yes |
| `backend/migrations/env.py` | Migration DB selection | Can select `DIRECT_URL` different from runtime | Likely |
| `backend/migrations/versions/36be61daa828_initial_auditweave_schema.py` | User schema | Confirms constraints; future fixes may need migration | Likely |
| `backend/app/api/routes.py` | Legacy alternate app | Conflicting unauthenticated in-memory app | Yes/remove or clearly isolate |
| `backend/.env` | Live local secrets/DB selection | Ignored by Git but included in Docker context; values not disclosed | Environment action required |
| `backend/.env.example` | Environment documentation | Correct auth variable naming | No |
| `backend/Dockerfile` | Backend image | Copies `.env` without `.dockerignore` | Yes |
| `docker-compose.yml` | Container auth/DB/API configuration | Static JWT secret; `/api` duplication; env override risk | Yes |
| `.gitignore` | Secret/database tracking protection | Correctly ignores `.env` and DB files | No |
| `README.md` | Setup instructions | Uses `SECRET_KEY` rather than `JWT_SECRET`; DB docs conflict with current config | Yes |

## 17. Final Verdict

1. **Can a new user successfully register today?** Not verified live. The source path should work only when the configured PostgreSQL database is reachable and migrated; the audited DB connection currently fails.
2. **Is the new user persisted in the intended database?** The endpoint commits to the `DATABASE_URL` database, but “intended” is ambiguous because local config is PostgreSQL, README/Alembic fallback/Compose reference SQLite, and Docker `.env` precedence can override Compose. Live persistence was not verified.
3. **Can that new user log in?** Source contract says yes after a successful commit, using case-insensitive lookup and PBKDF2 verification. Not live-verified due database unavailability.
4. **Is login secure enough for production?** No. Known admin credentials, unsafe JWT secret paths, localStorage, no throttling/revocation, weak password policy, and missing server authorization block production.
5. **Does authentication survive refresh?** The local token survives, but validity is not checked; expired/malformed tokens also appear authenticated.
6. **Are protected APIs actually protected?** No. Strict JWT validation is unused; most APIs have no auth dependency and three accept/downgrade to guest.
7. **Is admin access properly secured?** No. A known admin is seeded and prefilled, admin APIs are absent, and the defined server role guard is unused.
8. **What exactly blocks production readiness?** Critical credential/key exposure, missing backend authorization/ownership, unsafe Docker secret handling, unreliable deployment URL/DB selection, incomplete session lifecycle, and insufficient password/abuse controls.
9. **First three fixes:** (1) rotate/remove embedded credentials and signing keys, (2) enforce strict server-side authentication/authorization and ownership, (3) fix secret/config injection so Docker and local environments use one explicit intended database/API URL.

