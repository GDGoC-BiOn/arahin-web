import { describe, expect, it } from "vitest";
import {
  accessTokenMaxAge,
  clearedSessionCookie,
  REFRESH_THRESHOLD_SECONDS,
  readSessionToken,
  SESSION_COOKIE,
  sessionCookie,
  shouldRefresh,
} from "@/shared/infrastructure/session/session-cookie";

function base64Url(value: object): string {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function jwtWithExp(secondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow;
  return `${base64Url({ alg: "HS256" })}.${base64Url({ sub: "u1", exp })}.sig`;
}

function requestWithCookie(header: string): Request {
  return new Request("http://internal/", { headers: { cookie: header } });
}

describe("readSessionToken", () => {
  it("finds the session cookie among others", () => {
    const request = requestWithCookie(
      `theme=dark; ${SESSION_COOKIE}=abc.def.ghi; other=1`,
    );
    expect(readSessionToken(request)).toBe("abc.def.ghi");
  });

  it("returns null when absent or empty", () => {
    expect(readSessionToken(requestWithCookie("theme=dark"))).toBeNull();
    expect(
      readSessionToken(requestWithCookie(`${SESSION_COOKIE}=`)),
    ).toBeNull();
    expect(readSessionToken(new Request("http://internal/"))).toBeNull();
  });

  it("does not match a cookie that merely ends with the name", () => {
    expect(
      readSessionToken(requestWithCookie(`not_${SESSION_COOKIE}=nope`)),
    ).toBeNull();
  });

  it("decodes percent-encoded values", () => {
    expect(readSessionToken(requestWithCookie(`${SESSION_COOKIE}=a%2Eb`))).toBe(
      "a.b",
    );
  });
});

describe("accessTokenMaxAge", () => {
  it("derives the lifetime from the token's own exp", () => {
    const age = accessTokenMaxAge(jwtWithExp(3600));
    expect(age).toBeGreaterThan(3590);
    expect(age).toBeLessThanOrEqual(3600);
  });

  it("returns 0 for an already expired token", () => {
    expect(accessTokenMaxAge(jwtWithExp(-60))).toBe(0);
  });

  it("falls back to an hour when exp is unreadable", () => {
    expect(accessTokenMaxAge("not-a-jwt")).toBe(3600);
    expect(accessTokenMaxAge(`${base64Url({})}.%%%.sig`)).toBe(3600);
  });
});

describe("sessionCookie", () => {
  it("is httpOnly, lax and path-wide so page scripts cannot read it", () => {
    const cookie = sessionCookie(jwtWithExp(3600));
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toMatch(/Max-Age=\d+/);
  });

  it("expires immediately when cleared", () => {
    expect(clearedSessionCookie()).toContain("Max-Age=0");
    expect(clearedSessionCookie()).toContain("HttpOnly");
  });
});

describe("shouldRefresh", () => {
  it("leaves a fresh token alone", () => {
    expect(shouldRefresh(jwtWithExp(3600))).toBe(false);
  });

  it("renews once the token is inside the threshold", () => {
    expect(shouldRefresh(jwtWithExp(REFRESH_THRESHOLD_SECONDS - 30))).toBe(
      true,
    );
  });

  it("does not try to renew an already expired token", () => {
    // Past expiry the backend rejects it outright; renewal is impossible.
    expect(shouldRefresh(jwtWithExp(-1))).toBe(false);
  });

  it("leaves a token with no readable exp to the backend", () => {
    expect(shouldRefresh("not-a-jwt")).toBe(false);
  });
});
