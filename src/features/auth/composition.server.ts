import "server-only";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { callBackend } from "@/shared/infrastructure/http/arahin-backend";
import { readSessionToken } from "@/shared/infrastructure/session/session-cookie";
import type { AuthUser } from "./domain/auth-user";
import { authHandlers } from "./infrastructure/auth-handlers";

export { authHandlers };

/**
 * Server-side session read for guarding pages. Returns null for any 401 —
 * expired, revoked, or displaced by the backend's single-session lock — so
 * callers only have to handle "signed in" or "not".
 */
export async function currentUserFromCookie(
  cookieHeader: string | null,
): Promise<AuthUser | null> {
  const request = new Request("http://internal/", {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  const token = readSessionToken(request);
  if (!token) return null;
  try {
    return await callBackend<AuthUser>({
      path: "/v1/me",
      method: "GET",
      token,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
