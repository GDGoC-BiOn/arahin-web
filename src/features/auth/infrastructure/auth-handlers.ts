import { ApiError } from "@/shared/infrastructure/http/api-error";
import {
  callBackend,
  fetchBackendRaw,
} from "@/shared/infrastructure/http/arahin-backend";
import {
  clearedSessionCookie,
  readSessionToken,
  sessionCookie,
  shouldRefresh,
} from "@/shared/infrastructure/session/session-cookie";
import type { AuthUser } from "../domain/auth-user";

/**
 * Framework-agnostic Request -> Response handlers, mirroring the shape the
 * starter's task-handlers used. `src/app/api/auth/*` route files are thin
 * re-exports over these.
 *
 * These exist because the Go backend registers no CORS middleware, so the
 * browser cannot call it directly. Proxying also keeps the JWT server-side:
 * it arrives here, goes into an httpOnly cookie, and never reaches page JS.
 */
type AuthResponse = { user: AuthUser; accessToken: string };

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

function errorResponse(error: unknown): Response {
  const api =
    error instanceof ApiError
      ? error
      : new ApiError("Terjadi kesalahan. Coba lagi.", "INTERNAL", 500);
  return Response.json(
    { error: { code: api.code, message: api.message } },
    { status: api.status ?? 500, headers: JSON_HEADERS },
  );
}

async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Hands the client the user and nothing else; the token is swapped for a
 * cookie here so it is never exposed to scripts on the page.
 */
async function authenticate(
  path: "/v1/auth/login" | "/v1/auth/register",
  body: Record<string, string>,
): Promise<Response> {
  const result = await callBackend<AuthResponse>({
    path,
    method: "POST",
    body,
  });
  return Response.json(
    { user: result.user },
    {
      status: 200,
      headers: {
        ...JSON_HEADERS,
        "Set-Cookie": sessionCookie(result.accessToken),
      },
    },
  );
}

const OAUTH_STATE_COOKIE = "arahin_oauth_state";

function redirectTo(location: string, cookies: string[] = []): Response {
  const headers = new Headers({
    Location: location,
    "Cache-Control": "no-store",
  });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=") || null;
  }
  return null;
}

export const authHandlers = {
  /**
   * Starts Google sign-in. The backend issues the CSRF state cookie and the
   * redirect to Google; both are relayed so the cookie lands on this origin,
   * where the callback below can read it back.
   */
  async googleStart(): Promise<Response> {
    try {
      const upstream = await fetchBackendRaw({
        path: "/v1/auth/google",
        redirect: "manual",
      });
      const location = upstream.headers.get("location");
      if (upstream.status >= 300 && upstream.status < 400 && location) {
        return redirectTo(location, upstream.headers.getSetCookie());
      }
    } catch {
      // Falls through to the sign-in screen with an explanation.
    }
    return redirectTo("/masuk?error=google");
  },

  /**
   * Google returns here (GOOGLE_REDIRECT_URL must point at this route). The
   * code is exchanged by the backend, and its JSON session becomes the same
   * httpOnly cookie email sign-in uses.
   */
  async googleCallback(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const state = readCookie(request, OAUTH_STATE_COOKIE);
    const clearState = `${OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
    try {
      const upstream = await fetchBackendRaw({
        path: `/v1/auth/google/callback?${url.searchParams.toString()}`,
        headers: state ? { cookie: `${OAUTH_STATE_COOKIE}=${state}` } : {},
      });
      if (upstream.ok) {
        const body = (await upstream.json()) as Partial<AuthResponse>;
        if (typeof body.accessToken === "string" && body.accessToken) {
          return redirectTo("/beranda", [
            sessionCookie(body.accessToken),
            clearState,
          ]);
        }
      }
    } catch {
      // Falls through.
    }
    return redirectTo("/masuk?error=google", [clearState]);
  },

  async login(request: Request): Promise<Response> {
    try {
      const body = await readJsonBody(request);
      return await authenticate("/v1/auth/login", {
        email: asString(body.email),
        password: asString(body.password),
      });
    } catch (error) {
      return errorResponse(error);
    }
  },

  async register(request: Request): Promise<Response> {
    try {
      const body = await readJsonBody(request);
      return await authenticate("/v1/auth/register", {
        email: asString(body.email),
        password: asString(body.password),
        fullName: asString(body.fullName),
      });
    } catch (error) {
      return errorResponse(error);
    }
  },

  /**
   * Always answers the same way whether or not the email exists — the backend
   * does too, so this cannot be used to discover accounts.
   */
  async forgotPassword(request: Request): Promise<Response> {
    try {
      const body = await readJsonBody(request);
      await callBackend<unknown>({
        path: "/v1/auth/forgot-password",
        method: "POST",
        body: { email: asString(body.email) },
      });
      return Response.json(
        { ok: true },
        { status: 200, headers: JSON_HEADERS },
      );
    } catch (error) {
      return errorResponse(error);
    }
  },

  async resetPassword(request: Request): Promise<Response> {
    try {
      const body = await readJsonBody(request);
      await callBackend<unknown>({
        path: "/v1/auth/reset-password",
        method: "POST",
        body: {
          token: asString(body.token),
          newPassword: asString(body.newPassword),
        },
      });
      return Response.json(
        { ok: true },
        { status: 200, headers: JSON_HEADERS },
      );
    } catch (error) {
      return errorResponse(error);
    }
  },

  /**
   * Always clears the cookie, even when the backend call fails. Leaving a
   * dead token in the browser would strand the user in a half-signed-in
   * state with no way to recover from the UI.
   */
  async logout(request: Request): Promise<Response> {
    const token = readSessionToken(request);
    if (token) {
      try {
        await callBackend<void>({
          path: "/v1/auth/logout",
          method: "POST",
          token,
        });
      } catch {
        // The session is going away locally regardless.
      }
    }
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": clearedSessionCookie(), ...JSON_HEADERS },
    });
  },

  async me(request: Request): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) {
      return Response.json(
        { user: null },
        { status: 200, headers: JSON_HEADERS },
      );
    }
    try {
      // Renew in place when the token is nearing expiry. /v1/auth/refresh
      // already returns the user, so this replaces the /v1/me call rather
      // than adding to it, and the session extends without the user noticing.
      if (shouldRefresh(token)) {
        const refreshed = await callBackend<AuthResponse>({
          path: "/v1/auth/refresh",
          method: "POST",
          token,
        });
        return Response.json(
          { user: refreshed.user },
          {
            status: 200,
            headers: {
              ...JSON_HEADERS,
              "Set-Cookie": sessionCookie(refreshed.accessToken),
            },
          },
        );
      }
      const user = await callBackend<AuthUser>({
        path: "/v1/me",
        method: "GET",
        token,
      });
      return Response.json({ user }, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      // A revoked or expired session is not an error to the caller: it means
      // "signed out". The backend's single-session lock revokes the previous
      // session whenever the same account signs in elsewhere, so this is a
      // routine outcome, not an exception.
      if (error instanceof ApiError && error.status === 401) {
        return Response.json(
          { user: null },
          {
            status: 200,
            headers: { ...JSON_HEADERS, "Set-Cookie": clearedSessionCookie() },
          },
        );
      }
      return errorResponse(error);
    }
  },
};
