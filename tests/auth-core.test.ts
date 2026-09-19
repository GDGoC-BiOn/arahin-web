import { describe, expect, it, vi } from "vitest";
import { createAuthUseCases } from "@/features/auth/application/auth-use-cases";
import type { AuthGateway } from "@/features/auth/domain/auth-gateway";
import type { AuthUser } from "@/features/auth/domain/auth-user";
import {
  normalizeEmail,
  normalizeFullName,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/domain/credentials";
import {
  loginFormSchema,
  registerFormSchema,
} from "@/features/auth/presentation/auth-form-schemas";
import { authErrorMessage } from "@/features/auth/presentation/auth-messages";

const user: AuthUser = { id: "u1", email: "a@b.co", fullName: "Ahmad Dimas" };

function fakeGateway(): AuthGateway {
  return {
    login: vi.fn().mockResolvedValue(user),
    register: vi.fn().mockResolvedValue(user),
    logout: vi.fn().mockResolvedValue(undefined),
    currentUser: vi.fn().mockResolvedValue(user),
    requestPasswordReset: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue(undefined),
  };
}

describe("credentials normalization", () => {
  it("lowercases and trims email the way the backend does", () => {
    expect(normalizeEmail("  Dimasmurjoko22@Gmail.com ")).toBe(
      "dimasmurjoko22@gmail.com",
    );
  });

  it("trims the full name without touching its casing", () => {
    expect(normalizeFullName("  Ahmad Dimas Murjoko  ")).toBe(
      "Ahmad Dimas Murjoko",
    );
  });
});

describe("auth use cases", () => {
  it("normalizes before signing in, and never touches the password", async () => {
    const gateway = fakeGateway();
    await createAuthUseCases(gateway).signIn({
      email: " A@B.CO ",
      password: "  secret  ",
    });
    expect(gateway.login).toHaveBeenCalledWith({
      email: "a@b.co",
      password: "  secret  ",
    });
  });

  it("normalizes email and name when signing up", async () => {
    const gateway = fakeGateway();
    await createAuthUseCases(gateway).signUp({
      email: " NEW@Mail.CO ",
      password: "12345678",
      fullName: "  Dimas  ",
    });
    expect(gateway.register).toHaveBeenCalledWith({
      email: "new@mail.co",
      password: "12345678",
      fullName: "Dimas",
    });
  });

  it("passes the current user through", async () => {
    const useCases = createAuthUseCases(fakeGateway());
    await expect(useCases.loadCurrentUser()).resolves.toEqual(user);
  });
});

describe("form schemas mirror the backend rules", () => {
  it("rejects a display-name style address, as net/mail does", () => {
    expect(
      loginFormSchema.safeParse({
        email: "Name <a@b.co>",
        password: "secret",
      }).success,
    ).toBe(false);
  });

  it("requires both login fields", () => {
    expect(
      loginFormSchema.safeParse({ email: "", password: "x" }).success,
    ).toBe(false);
    expect(
      loginFormSchema.safeParse({ email: "a@b.co", password: "" }).success,
    ).toBe(false);
  });

  it("enforces the 8 character minimum on registration", () => {
    const base = { fullName: "Dimas", email: "a@b.co" };
    expect(
      registerFormSchema.safeParse({ ...base, password: "1234567" }).success,
    ).toBe(false);
    expect(
      registerFormSchema.safeParse({
        ...base,
        password: "1".repeat(PASSWORD_MIN_LENGTH),
      }).success,
    ).toBe(true);
  });

  it("requires a full name", () => {
    expect(
      registerFormSchema.safeParse({
        fullName: "   ",
        email: "a@b.co",
        password: "12345678",
      }).success,
    ).toBe(false);
  });
});

describe("authErrorMessage", () => {
  it("translates the backend codes the user can act on", () => {
    expect(authErrorMessage("INVALID_CREDENTIALS", "ignored")).toBe(
      "Email atau kata sandi salah.",
    );
    expect(authErrorMessage("EMAIL_TAKEN", "ignored")).toContain(
      "sudah terdaftar",
    );
  });

  it("keeps the backend's own copy for codes it does not map", () => {
    // UNAUTHORIZED_GUEST ships deliberate Indonesian product copy.
    expect(authErrorMessage("UNAUTHORIZED_GUEST", "Session locked.")).toBe(
      "Session locked.",
    );
  });
});

import {
  PASSWORD_MAX_BYTES,
  passwordByteLength,
} from "@/features/auth/domain/credentials";

describe("password byte limit", () => {
  it("counts UTF-8 bytes, as bcrypt does", () => {
    expect(passwordByteLength("a".repeat(PASSWORD_MAX_BYTES))).toBe(72);
    expect(passwordByteLength("é")).toBe(2);
  });
});

import {
  forgotPasswordFormSchema,
  resetPasswordFormSchema,
} from "@/features/auth/presentation/auth-form-schemas";

describe("password reset", () => {
  it("normalizes the email before requesting a reset", async () => {
    const gateway = fakeGateway();
    await createAuthUseCases(gateway).requestPasswordReset("  A@B.CO ");
    expect(gateway.requestPasswordReset).toHaveBeenCalledWith("a@b.co");
  });

  it("trims the token but never the new password", async () => {
    const gateway = fakeGateway();
    await createAuthUseCases(gateway).resetPassword(" tok ", " spaced pw ");
    expect(gateway.resetPassword).toHaveBeenCalledWith("tok", " spaced pw ");
  });

  it("requires the confirmation to match", () => {
    expect(
      resetPasswordFormSchema.safeParse({
        password: "arahin123",
        confirm: "arahin124",
      }).success,
    ).toBe(false);
    expect(
      resetPasswordFormSchema.safeParse({
        password: "arahin123",
        confirm: "arahin123",
      }).success,
    ).toBe(true);
  });

  it("maps reset token errors to Indonesian", () => {
    for (const code of ["TOKEN_EXPIRED", "TOKEN_USED", "INVALID_TOKEN"]) {
      expect(authErrorMessage(code, "english")).not.toBe("english");
    }
    expect(forgotPasswordFormSchema.safeParse({ email: "x" }).success).toBe(
      false,
    );
  });
});
