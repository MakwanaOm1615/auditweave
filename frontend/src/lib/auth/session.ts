import type { AuthTokenResponse } from "./types";

const TOKEN_KEY = "auditweave_token";
const ROLE_KEY = "auditweave_role";
const EMAIL_KEY = "auditweave_email";
export const AUTH_SESSION_EVENT = "auditweave-auth-session";

function notifySessionChanged(): void {
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const value: unknown = JSON.parse(atob(padded));
    return typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(EMAIL_KEY);
  notifySessionChanged();
}

export function saveAuthSession(response: AuthTokenResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, response.access_token);
  localStorage.setItem(ROLE_KEY, response.role);
  localStorage.setItem(EMAIL_KEY, response.email);
  notifySessionChanged();
}

export function getValidAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const expiration = payload?.exp;
  if (typeof expiration !== "number" || expiration * 1000 <= Date.now()) {
    clearAuthSession();
    return null;
  }
  return token;
}

export function getStoredRole(): string {
  return typeof window === "undefined" ? "user" : localStorage.getItem(ROLE_KEY) || "user";
}

export function getStoredEmail(): string {
  return typeof window === "undefined" ? "" : localStorage.getItem(EMAIL_KEY) || "";
}
