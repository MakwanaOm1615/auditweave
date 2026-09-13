# PolicyLense User Authentication Fix Report

## 1. Current Architecture

### Login

```text
Next.js LoginPage
  -> typed login(email, password)
  -> POST /api/auth/login
  -> Pydantic UserLogin normalization/validation
  -> SQLAlchemy PostgreSQL/Supabase lookup
  -> PBKDF2 password verification
  -> HS256 JWT signed by required JWT_SECRET
  -> validated AuthTokenResponse
  -> localStorage session (temporary architecture)
  -> authenticated API requests with Bearer token
```

### Signup

```text
Next.js RegisterPage
  -> mirrored password/confirmation validation
  -> typed register(email, password)
  -> POST /api/auth/register
  -> Pydantic email normalization + authoritative password validation
  -> user_auth.create_user
  -> case-normalized duplicate lookup
  -> PBKDF2 password hash
  -> one SQLAlchemy transaction: User + AuditLog
  -> PostgreSQL/Supabase commit
  -> validated RegisteredUserResponse
  -> redirect to login (no automatic login)
```

The canonical backend remains `backend/main.py -> backend/app/main.py:app`. SQLAlchemy and Alembic remain the persistence architecture. No mock/static auth path was added.

## 2. Issues Re-Verified

| Previous finding | Status | Current verification and action |
|---|---|---|
| Login/signup database was broken | **OUTDATED** | The supplied current state says PostgreSQL/Supabase and Alembic head were manually verified. The implementation preserves that architecture and now requires `DATABASE_URL`; it does not fall back to SQLite. |
| Login form exposed prefilled credentials | **CONFIRMED** | Removed all prefilled email/password state. The form now starts empty. |
| Signup accepted weak/blank passwords | **CONFIRMED** | Backend now requires 12-128 characters and rejects blank/highly repetitive values; frontend mirrors the important rules. Login has a separate compatibility schema. |
| Registration/login email behavior differed | **CONFIRMED** | Both schemas now trim and lowercase email. Duplicate lookup and login lookup both use the normalized identity. New stored emails are lowercase. |
| Duplicate registration could partially succeed or raise unstable DB errors | **CONFIRMED** | User and registration audit log now share one transaction. Integrity conflicts map to HTTP 409; other SQLAlchemy failures rollback and map to a generic HTTP 503. |
| JWT used a committed fallback secret | **CONFIRMED** | Removed. API startup now fails clearly if `JWT_SECRET` is absent. Docker Compose also requires an externally supplied value. |
| Any successful 2xx login response caused redirect | **CONFIRMED** | Login now validates token, token type, role, and email before saving or redirecting. Missing/malformed token responses throw an error. |
| Expired/malformed local tokens appeared authenticated forever | **CONFIRMED** | Client session helper checks JWT structure and `exp`, clears stale values, and notifies the layout. Backend remains the signature authority. |
| Multipart uploads omitted Authorization | **CONFIRMED** | Multipart requests now reuse auth headers and correctly leave `Content-Type` unset so the browser supplies the boundary. |
| User audit data APIs were public | **CONFIRMED** | Audit create/history/detail/delete/report/dashboard/compare/copilot/rewrite/research operations now require `get_current_user`. Ownership filters prevent cross-user audit access. |
| Invalid protected-request token silently became guest | **CONFIRMED** | Protected routes no longer use optional auth. Optional auth now returns `None` only when no token is supplied and rejects a supplied invalid/expired token. Hardcoded guest creation was removed. |
| Magic-link/code UI was fake | **CONFIRMED** | Removed the staged/passwordless copy and behavior. Login is now an accurate password form with a visibility toggle. |
| Signup names were required but discarded | **CONFIRMED** | Removed first/last name fields because the current user model does not persist them. Added confirm password instead. |
| `.env` could enter Docker build contexts | **CONFIRMED** | Added backend/frontend `.dockerignore` files covering environment files, dependencies, caches, local DBs, logs, and Git metadata. |
| Docker frontend could build `/api/api` | **CONFIRMED** | Base URL is normalized to exactly one `/api`; Docker now supplies `NEXT_PUBLIC_API_URL` at build time. |
| Password comparison was not explicitly constant time | **CONFIRMED** | Changed to `hmac.compare_digest`. Existing stored hash format remains compatible. |
| Sensitive `.env` files were tracked by Git | **FALSE** | They remain ignored and untracked. Docker context exclusion was the real gap. |

## 3. Files Changed

| File | Responsibility | Why Changed |
|---|---|---|
| `backend/app/auth.py` | JWT/password dependencies | Require JWT secret, constant-time hash comparison, remove hardcoded guest fallback, reject invalid supplied optional token. |
| `backend/app/database.py` | Database configuration | Preserve injected environment precedence and require configured PostgreSQL/Supabase URL instead of SQLite fallback. |
| `backend/app/main.py` | Auth routes and user-owned APIs | Use auth service/login schema; add strict JWT dependencies and ownership filters. |
| `backend/app/schemas.py` | Auth request validation | Normalize emails; split signup/login password rules; enforce signup password policy. |
| `docker-compose.yml` | Deployment configuration | Require external JWT/database values; remove SQLite volume; pass normalized public API URL at build time. |
| `frontend/Dockerfile` | Frontend production build | Compile the public API base from an explicit build argument. |
| `frontend/src/lib/api.ts` | Typed auth/API transport | Validate auth responses, improve API errors, normalize base URL, clear on 401, authenticate multipart and PDF requests. |
| `frontend/src/app/login/page.tsx` | Login form | Remove credentials/passwordless stub; add validation, visibility control, typed errors, and real-token-only redirect. |
| `frontend/src/app/register/page.tsx` | Signup form | Remove unpersisted names; add confirm password, mirrored validation, typed errors, and login redirect. |
| `frontend/src/app/layout.tsx` | Session-aware route UI | React to session-clear/save events and remove duplicate logout state update. |
| `frontend/src/app/audit/[id]/page.tsx` | Owned PDF download | Replace unauthenticated hardcoded report URL with authenticated download helper. |
| `frontend/src/app/audit/batch/page.tsx` | Owned PDF download | Use authenticated report download helper. |
| `frontend/src/app/history/page.tsx` | Owned PDF download | Use authenticated report download helper. |
| `frontend/src/app/compare/page.tsx` | Owned comparison PDF | Use authenticated comparison download helper. |

## 4. New Files Created

| File | Responsibility | Why Needed |
|---|---|---|
| `backend/app/services/user_auth.py` | User creation/authentication transaction service | Keeps database transaction/error logic out of the already-large route module. |
| `frontend/src/lib/auth/types.ts` | Auth API types/runtime guards | Ensures malformed responses cannot establish a session. |
| `frontend/src/lib/auth/session.ts` | Token storage/expiry/session notifications | Centralizes the existing temporary localStorage lifecycle. |
| `frontend/src/lib/auth/validation.ts` | Email/password UX validation | Mirrors core backend rules without duplicating them in form components. |
| `backend/.dockerignore` | Backend context protection | Prevents local secrets, environments, caches, DBs, and Git data entering images. |
| `frontend/.dockerignore` | Frontend context protection | Prevents local env/dependency/build/cache files entering images. |
| `AUTH_USER_FLOW_FIX_REPORT.md` | Implementation record | Required output report. |

## 5. Login Flow After Fix

1. Empty email/password fields render immediately; there is no prefilled account and no fake code flow.
2. Client validates required values, normalizes the email, enters loading state, and disables submit.
3. Typed API code posts `{email,password}` to the normalized `/api/auth/login` URL.
4. `UserLogin` validates email and normalizes it to lowercase while allowing existing nonblank passwords up to 128 characters.
5. `authenticate_user` performs a real SQLAlchemy lookup and PBKDF2 verification, records the login, and commits.
6. Backend issues a 10-hour HS256 JWT with `sub` and `exp`, signed only by configured `JWT_SECRET`.
7. Frontend runtime-validates the complete token response. It stores the real response email/role/token only after validation, then redirects.
8. Shared JSON, multipart, and PDF requests attach `Authorization: Bearer <token>`.
9. Invalid/expired tokens receive backend 401; client clears session. Client also clears obviously malformed/expired stored tokens on access.

Unknown email and wrong password retain the same generic backend response. Database errors return a generic 503 rather than internal details.

## 6. Signup Flow After Fix

1. UI collects only modeled data: email, password, confirmation.
2. Client mirrors the 12-character minimum, repetition check, and equality check for immediate feedback.
3. Backend independently validates `EmailStr`, trims/lowercases identity, limits password length to 12-128, and rejects blank/repetitive passwords.
4. `create_user` checks the normalized identity case-insensitively, hashes the password with the existing salted PBKDF2 format, flushes the new user, adds its registration log, and commits once.
5. Exact concurrent conflicts are caught by the existing unique email index and returned as stable HTTP 409 after rollback.
6. Other SQLAlchemy failures rollback and return a generic HTTP 503.
7. The frontend validates the returned user shape and redirects to `/login`; it does not automatically authenticate the new account.

## 7. Database Behavior

- **Database used:** configured PostgreSQL/Supabase through SQLAlchemy `DATABASE_URL`.
- **Persistence path:** `register -> services.user_auth.create_user -> Session -> users + audit_logs -> one commit`.
- **Transaction behavior:** user and registration log are atomic; conflicts/service failures rollback.
- **SQLite regression:** none. The runtime fallback and Docker SQLite configuration were removed.
- **Schema creation:** no `Base.metadata.create_all()` was added or enabled.
- **Migrations:** Alembic remains intact and no migration/schema change was created.
- **Existing data:** current normalized code prevents new case variants. Existing mixed-case duplicates, if any, require a separately approved data review before a future functional unique constraint.
- **Historical ownership:** audits with `created_by IS NULL` are no longer exposed to normal users. A future controlled ownership/backfill decision may be required for legacy records.

## 8. Security Improvements

- Authoritative server-side signup password validation plus mirrored UX checks.
- One lowercase/trim normalization strategy across signup, storage, duplicate lookup, login, and JWT subject for new users.
- Required external `JWT_SECRET`; no fallback or Docker default.
- Constant-time password-hash comparison.
- Strict JWT dependencies on normal-user audit operations.
- Ownership constraints on audit history, detail, deletion, PDF, dashboard, comparison, copilot, and finding rewrite queries.
- No silent guest downgrade for protected routes and no hardcoded guest-account creation.
- Authenticated multipart upload and authenticated blob-based report downloads.
- Structured API validation/error extraction without exposing SQL errors.
- Docker contexts now exclude local secrets and artifacts.

## 9. Frontend Typing

- No new `any` type was introduced (`git diff` added-line scan: zero matches).
- Auth responses use `AuthTokenResponse` and `RegisteredUserResponse`.
- Auth JSON is received as `unknown` and runtime-narrowed before use.
- Form catch variables use `unknown` and `getErrorMessage` performs safe narrowing.
- Session JWT payload parses as `unknown` then narrows to `Record<string, unknown>`.
- Existing unrelated `any` types remain in legacy application pages/API return types; they were not introduced by this phase. Auth-specific new files and modified form code contain none.

## 10. Dynamic Data Verification

No fake login, mock user list, static authenticated state, frontend-only signup, or hardcoded success response was introduced. The forms call FastAPI; FastAPI queries/commits through SQLAlchemy; responses come from database-backed `User` records; frontend accepts login only after validating the real JWT response. Hardcoded guest authentication was removed.

The repository's separate research/compliance mock data and legacy `backend/app/api/routes.py` were outside login/signup scope and were not made part of authentication.

## 11. Tests / Checks Run

| Command | Result | Status |
|---|---|---|
| `npx tsc --noEmit` | Completed with no errors. | PASS |
| `npm run build` | Next.js 16.2.9 production build and TypeScript completed; all routes generated. Only existing multiple-lockfile workspace warning. | PASS |
| `npx eslint src/app/login/page.tsx src/app/register/page.tsx src/app/layout.tsx src/lib/auth/types.ts src/lib/auth/session.ts src/lib/auth/validation.ts` | 0 errors; one pre-existing `<img>` performance warning in layout. | PASS |
| `npm run lint` | Full repository: 102 errors/40 warnings, chiefly pre-existing explicit `any`, effect, and unescaped-entity issues across unrelated pages. No claim of full lint pass. | FAIL (pre-existing repository debt) |
| Modified-backend `ast.parse` check | All five modified Python modules parsed. | PASS |
| Ephemeral-env schema/hash/JWT assertion script | Email normalized; weak signup rejected; login schema accepted nonblank credential; PBKDF2 verify and JWT claims passed. | PASS |
| Ephemeral-env FastAPI route dependency inspection | All selected normal-user endpoints include `get_current_user`; none uses optional auth. | PASS |
| `python -m pytest` | Collection failed because `app/knowledge_base/test_pdf.py` uses a working-directory-dependent PDF path. | FAIL (unrelated pre-existing test) |
| `python -m pytest tests` | Collected 4 compliance tests, reached 2 passes, then exceeded both 120s and 300s limits during remaining analysis. | INCOMPLETE (unrelated long-running suite) |
| `git diff --check` | No whitespace errors. | PASS |
| Added-line forbidden-`any` scan | Zero new matches. | PASS |
| Auth fallback/prefill search | Removed normal-user prefill, guest credential, and JWT fallback matches. | PASS |

The auth checks used a process-only test signing value and did not write it to any file or print real secrets. No production user was inserted and no production database mutation test was performed.

## 12. Remaining User-Auth Issues

1. **localStorage remains temporary:** it is still JavaScript-readable and therefore not the final production session design. Moving to Secure/HttpOnly/SameSite cookies or a mature auth/session library is deferred to the next auth phase.
2. **No token revocation/refresh:** logout clears the browser session but cannot revoke a copied JWT; access token lifetime remains 10 hours.
3. **No login rate limiting:** gateway/application throttling, credential-stuffing defense, and account abuse monitoring remain to be implemented.
4. **No email verification/password reset:** account ownership verification and recovery are not present.
5. **Legacy data review:** inspect existing mixed-case users before adding a future database-level case-insensitive unique constraint; decide how to assign legacy audits with null `created_by`.
6. **Browser E2E tests:** a dedicated non-production database is needed to safely prove real registration, login, cross-user 404 behavior, expiry, and upload/report flows.
7. **OAuth2 docs mismatch:** the JSON login endpoint and `OAuth2PasswordBearer` form metadata are not aligned; this does not break the current frontend but affects Swagger OAuth2 login.

## 13. Deferred - Admin Phase

Admin functionality was not redesigned or implemented. Existing concerns remain explicitly deferred:

- Startup still provisions a hardcoded administrator credential.
- Frontend admin API helper functions have no canonical backend endpoints.
- `get_current_admin_user` remains defined but unused.
- Client role values remain localStorage-readable and must never be an authorization source.
- Admin/compliance-officer role semantics, provisioning, endpoints, dashboard, and authorization tests need a dedicated phase.

No admin route, admin page, compliance-officer behavior, or role-management behavior was changed in this phase.

## 14. Final Verdict

1. **Is signup connected frontend -> backend -> database?** Yes, through typed API -> FastAPI -> auth service -> SQLAlchemy PostgreSQL/Supabase.
2. **Is login connected frontend -> backend -> database?** Yes; it performs a real normalized DB lookup and hash verification.
3. **Are passwords hashed and validated?** Yes. Signup validation is server-authoritative; stored values use the existing salted PBKDF2-HMAC-SHA256 format.
4. **Are email identities deterministic?** Yes for all new requests/records: trim + lowercase is consistent. Legacy duplicates still require review.
5. **Does signup handle DB transactions correctly?** Yes; user and registration log commit atomically with rollback and stable error mapping.
6. **Does frontend require a real token before login success?** Yes; the complete auth response is runtime-validated before storage/redirect.
7. **Are user-owned APIs backend-protected?** Yes for audit creation, history, detail, deletion, reports, dashboard, comparisons, copilot, rewrite, and research.
8. **Can one normal user access another user's audits?** The updated queries prevent it by filtering on authenticated `created_by`; unauthorized IDs return not found.
9. **Are file uploads authenticated correctly?** Yes; Bearer is attached and browser-managed multipart boundaries remain intact.
10. **Was any static/mock auth introduced?** No.
11. **Was any `any` type introduced?** No.
12. **Was admin functionality changed?** No.
13. **Is PostgreSQL/Supabase + Alembic preserved?** Yes; no schema or migration change was made and SQLite runtime/Docker fallback was removed.
14. **Is the code ready for the next auth phase?** Yes, after configuring `JWT_SECRET` and `DATABASE_URL`. The next phase should address production session storage/revocation, rate limiting, recovery/verification, legacy data cleanup, and then admin security.

