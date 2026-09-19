import { type NextRequest, NextResponse } from "next/server";
import {
  readSessionToken,
  sessionCookie,
  shouldRefresh,
} from "@/shared/infrastructure/session/session-cookie";

/**
 * Keeps the session alive across navigations.
 *
 * The backend has no separate refresh token: the access token IS the session,
 * and once it expires there is no recovery but re-login. Renewal therefore has
 * to happen while the token is still valid. Route handlers can only renew when
 * something calls them, and a server component cannot set a cookie during
 * render — so a request-level hook is the only place that covers a plain page
 * load.
 *
 * Deliberately NOT doing authorization here: verifying a session means asking
 * the backend, and the guarded pages already do that authoritatively. This only
 * extends a session that is about to lapse, and only when it is about to lapse.
 *
 * Imports are kept to the leaf cookie module and `fetch` on purpose. Proxy runs
 * on every matched request and can be deployed to the edge, so pulling in the
 * axios-based error plumbing here would be wasteful.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const token = readSessionToken(request);
  if (!token || !shouldRefresh(token)) return NextResponse.next();

  const baseUrl = (
    process.env.ARAHIN_API_URL ?? "http://localhost:8080"
  ).replace(/\/+$/, "");

  try {
    const response = await fetch(`${baseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return NextResponse.next();

    const body: unknown = await response.json();
    const accessToken =
      typeof body === "object" && body !== null
        ? (body as { accessToken?: unknown }).accessToken
        : undefined;
    if (typeof accessToken !== "string" || !accessToken) {
      return NextResponse.next();
    }

    const next = NextResponse.next();
    next.headers.append("Set-Cookie", sessionCookie(accessToken));
    return next;
  } catch {
    // A failed renewal is not a failed request. The token is still valid right
    // now; the user carries on and the next navigation tries again.
    return NextResponse.next();
  }
}

export const config = {
  // Every signed-in page, plus the session probe. Static assets and the public
  // onboarding/auth screens never need renewal.
  matcher: [
    "/beranda/:path*",
    "/profil/:path*",
    "/journey/:path*",
    "/ruang/:path*",
    "/sesi/:path*",
    "/api/auth/me",
  ],
};
