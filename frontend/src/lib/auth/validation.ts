export const PASSWORD_MIN_LENGTH = 12;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmailField(email: string): string | null {
  const e = normalizeEmail(email);
  if (!e) return "Email address is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(e)) return "Enter a valid email address.";
  
  // Catch common domain typos
  const domain = e.split("@")[1];
  const commonTypos: Record<string, string> = {
    "gma.com": "gmail.com",
    "gail.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmail.con": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahoo.con": "yahoo.com",
    "hotmal.com": "hotmail.com",
    "hotmail.con": "hotmail.com",
    "outlok.com": "outlook.com",
    "outlook.con": "outlook.com",
  };
  
  if (commonTypos[domain]) {
    return `Did you mean ${commonTypos[domain]}?`;
  }
  
  return null;
}

export function validatePasswordField(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (new Set(password).size < 3) return "Choose a less repetitive password.";
  return null;
}

export function validateLogin(email: string, password: string): string | null {
  const emailErr = validateEmailField(email);
  if (emailErr) return emailErr;
  if (!password) return "Password is required.";
  return null;
}

export function validateSignup(email: string, password: string, confirmation: string): string | null {
  const emailErr = validateEmailField(email);
  if (emailErr) return emailErr;
  
  const passErr = validatePasswordField(password);
  if (passErr) return passErr;

  if (password !== confirmation) return "Passwords do not match.";
  return null;
}

export function getPasswordStrength(password: string): "weak" | "medium" | "strong" | "none" {
  if (!password) return "none";
  if (password.length < 8) return "weak";
  
  let complexity = 0;
  if (/[a-z]/.test(password)) complexity++;
  if (/[A-Z]/.test(password)) complexity++;
  if (/[0-9]/.test(password)) complexity++;
  if (/[^a-zA-Z0-9]/.test(password)) complexity++;
  
  if (password.length >= PASSWORD_MIN_LENGTH && complexity >= 3) return "strong";
  if (password.length >= 8 && complexity >= 2) return "medium";
  return "weak";
}
