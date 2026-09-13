export const PASSWORD_MIN_LENGTH = 12;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateLogin(email: string, password: string): string | null {
  if (!normalizeEmail(email)) return "Enter your email address.";
  if (!password) return "Enter your password.";
  return null;
}

export function validateSignup(password: string, confirmation: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (new Set(password).size < 3) return "Choose a less repetitive password.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}
