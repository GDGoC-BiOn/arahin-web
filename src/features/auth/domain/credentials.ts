/**
 * Mirrors the rules the Go backend enforces in
 * internal/identity/routes.go so the form can reject bad input before a
 * round trip, and so both sides agree on what "normalised" means.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const FULL_NAME_MAX_LENGTH = 120;
/** bcrypt's hard limit on the backend, counted in UTF-8 bytes. */
export const PASSWORD_MAX_BYTES = 72;

export function passwordByteLength(password: string): number {
  return new TextEncoder().encode(password).length;
}

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = LoginCredentials & {
  fullName: string;
};

/** The backend lowercases and trims before lookup; match it exactly. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeFullName(raw: string): string {
  return raw.trim();
}
