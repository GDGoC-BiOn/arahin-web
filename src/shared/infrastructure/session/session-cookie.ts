/**
 * Cookie plumbing written against the Web platform (`Request` headers and a
 * `Set-Cookie` string) rather than `next/headers`, so the handlers that use
 * it stay framework-agnostic and directly testable.
 */
export const SESSION_COOKIE = "arahin_session";

/** Fallback when a token carries no readable `exp`. */
const FALLBACK_MAX_AGE_SECONDS = 60 * 60;

/**
 * How close to expiry a token gets renewed. The backend has no separate
 * refresh token — the access token IS the session, and once it expires there
 * is no recovery but re-login. So renewal has to happen while the token is
 * still valid, comfortably before the edge.
 */
export const REFRESH_THRESHOLD_SECONDS = 10 * 60;

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : null;
    }
  }
  return null;
}

/**
 * The backend has no separate refresh token — the access token IS the
 * session. Pinning the cookie's lifetime to the JWT's own `exp` keeps the two
 * from drifting, so the cookie never outlives the session it represents.
 * The payload is only read, never trusted: the backend still verifies it.
 */
export function accessTokenMaxAge(token: string): number {
  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  if (exp === null) return FALLBACK_MAX_AGE_SECONDS;
  const seconds = exp - Math.floor(Date.now() / 1000);
  return seconds > 0 ? seconds : 0;
}

/** True when the token is still usable but close enough to expiry to renew. */
export function shouldRefresh(
  token: string,
  thresholdSeconds = REFRESH_THRESHOLD_SECONDS,
): boolean {
  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  // No readable exp: leave it alone, the backend is the authority on validity.
  if (exp === null) return false;
  const remaining = exp - Math.floor(Date.now() / 1000);
  return remaining > 0 && remaining <= thresholdSeconds;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segment = token.split(".")[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    const parsed: unknown = JSON.parse(decoded);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function serialize(value: string, maxAge: number): string {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === "production") attributes.push("Secure");
  return attributes.join("; ");
}

export function sessionCookie(token: string): string {
  return serialize(token, accessTokenMaxAge(token));
}

export function clearedSessionCookie(): string {
  return serialize("", 0);
}
