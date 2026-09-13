export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  email: string;
}

export interface RegisteredUserResponse {
  id: number;
  first_name: string | null;
  email: string;
  role: string;
  created_at: string;
}

export type UserProfileResponse = RegisteredUserResponse;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseAuthTokenResponse(value: unknown): AuthTokenResponse {
  if (
    !isRecord(value) ||
    typeof value.access_token !== "string" ||
    value.access_token.length === 0 ||
    typeof value.token_type !== "string" ||
    value.token_type.toLowerCase() !== "bearer" ||
    typeof value.role !== "string" ||
    typeof value.email !== "string"
  ) {
    throw new Error("The authentication server returned an invalid response.");
  }
  return value as unknown as AuthTokenResponse;
}

export function parseRegisteredUserResponse(value: unknown): RegisteredUserResponse {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    !(typeof value.first_name === "string" || value.first_name === null) ||
    typeof value.email !== "string" ||
    typeof value.role !== "string" ||
    typeof value.created_at !== "string"
  ) {
    throw new Error("The account server returned an invalid response.");
  }
  return value as unknown as RegisteredUserResponse;
}

export function parseUserProfileResponse(value: unknown): UserProfileResponse {
  return parseRegisteredUserResponse(value);
}
