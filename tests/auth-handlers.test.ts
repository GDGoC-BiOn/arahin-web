import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authHandlers } from "@/features/auth/infrastructure/auth-handlers";
import { SESSION_COOKIE } from "@/shared/infrastructure/session/session-cookie";

const TOKEN = "header.payload.signature";
const USER = { id: "u1", email: "a@b.co", fullName: "Dimas" };

function backendJson(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function post(body: unknown, cookie?: string) {
  return new Request("http://app/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: cookie ? { cookie } : undefined,
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

/** Reads the first fetch call, failing loudly rather than yielding undefined. */
function firstCall(): {
  url: string;
  init: RequestInit & { headers: Record<string, string> };
} {
  const call = fetchMock.mock.calls[0];
  if (!call) throw new Error("expected fetch to have been called");
  const [url, init] = call as [
    string | URL,
    RequestInit & { headers: Record<string, string> },
  ];
  return { url: String(url), init };
}

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("login proxy", () => {
  it("swaps the access token for an httpOnly cookie and never returns it", async () => {
    fetchMock.mockResolvedValue(
      backendJson(200, { user: USER, accessToken: TOKEN }),
    );

    const response = await authHandlers.login(
      post({ email: "A@B.co", password: "secret" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ user: USER });
    // The token must not appear anywhere in the body.
    expect(JSON.stringify(payload)).not.toContain(TOKEN);

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${SESSION_COOKIE}=${TOKEN}`);
    expect(cookie).toContain("HttpOnly");
  });

  it("forwards only the credential fields to the backend", async () => {
    fetchMock.mockResolvedValue(
      backendJson(200, { user: USER, accessToken: TOKEN }),
    );

    await authHandlers.login(
      post({ email: "a@b.co", password: "secret", isAdmin: true }),
    );

    const { url, init } = firstCall();
    expect(url).toBe("http://localhost:8080/v1/auth/login");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "a@b.co",
      password: "secret",
    });
  });

  it("passes the backend's error code and status through", async () => {
    fetchMock.mockResolvedValue(
      backendJson(401, {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "email or password is incorrect",
        },
      }),
    );

    const response = await authHandlers.login(
      post({ email: "a@b.co", password: "wrong" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "email or password is incorrect",
      },
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("reports a network failure instead of throwing", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const response = await authHandlers.login(
      post({ email: "a@b.co", password: "secret" }),
    );

    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe("NETWORK_ERROR");
  });
});

describe("register proxy", () => {
  it("forwards fullName and sets the session cookie", async () => {
    fetchMock.mockResolvedValue(
      backendJson(201, { user: USER, accessToken: TOKEN }),
    );

    const response = await authHandlers.register(
      post({ email: "a@b.co", password: "12345678", fullName: "Dimas" }),
    );

    const { url, init } = firstCall();
    expect(url).toBe("http://localhost:8080/v1/auth/register");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "a@b.co",
      password: "12345678",
      fullName: "Dimas",
    });
    // The backend answers 201; the proxy normalises success to 200.
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("surfaces EMAIL_TAKEN as a 409", async () => {
    fetchMock.mockResolvedValue(
      backendJson(409, {
        error: { code: "EMAIL_TAKEN", message: "already exists" },
      }),
    );

    const response = await authHandlers.register(
      post({ email: "a@b.co", password: "12345678", fullName: "Dimas" }),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("EMAIL_TAKEN");
  });
});

describe("logout proxy", () => {
  it("sends the bearer token and clears the cookie", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const response = await authHandlers.logout(
      post({}, `${SESSION_COOKIE}=${TOKEN}`),
    );

    expect(firstCall().init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("still clears the cookie when the backend call fails", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));

    const response = await authHandlers.logout(
      post({}, `${SESSION_COOKIE}=${TOKEN}`),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("does not call the backend when there is no session", async () => {
    const response = await authHandlers.logout(post({}));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.status).toBe(204);
  });
});

function tokenExpiringIn(seconds: number): string {
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + seconds;
  return `${b64({ alg: "HS256" })}.${b64({ sub: "u1", exp })}.sig`;
}

describe("me proxy", () => {
  it("returns the user for a live session", async () => {
    fetchMock.mockResolvedValue(backendJson(200, USER));

    const response = await authHandlers.me(
      new Request("http://app/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE}=${TOKEN}` },
      }),
    );

    expect(await response.json()).toEqual({ user: USER });
    expect(firstCall().init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("answers user:null without calling the backend when no cookie is set", async () => {
    const response = await authHandlers.me(
      new Request("http://app/api/auth/me"),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ user: null });
  });

  it("renews a near-expiry token instead of calling /v1/me", async () => {
    const stale = tokenExpiringIn(60);
    const fresh = tokenExpiringIn(3600);
    fetchMock.mockResolvedValue(
      backendJson(200, { user: USER, accessToken: fresh }),
    );

    const response = await authHandlers.me(
      new Request("http://app/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE}=${stale}` },
      }),
    );

    const { url, init } = firstCall();
    expect(url).toBe("http://localhost:8080/v1/auth/refresh");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe(`Bearer ${stale}`);
    // One call only: refresh already returns the user.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await response.json()).toEqual({ user: USER });
    expect(response.headers.get("set-cookie")).toContain(fresh);
  });

  it("treats a revoked session as signed out, not an error", async () => {
    // The backend's single-session lock makes this a routine outcome:
    // signing in elsewhere revokes this session.
    fetchMock.mockResolvedValue(
      backendJson(401, {
        error: { code: "UNAUTHORIZED_GUEST", message: "Session locked." },
      }),
    );

    const response = await authHandlers.me(
      new Request("http://app/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE}=${TOKEN}` },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: null });
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
