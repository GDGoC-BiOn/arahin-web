import type { AuthUser } from "./auth-user";
import type { LoginCredentials, RegisterCredentials } from "./credentials";

/**
 * Note what is absent: no access token crosses this port. The JWT lives in an
 * httpOnly cookie the browser cannot read, so every method resolves to the
 * user alone.
 */
export type AuthGateway = {
  login(credentials: LoginCredentials): Promise<AuthUser>;
  register(credentials: RegisterCredentials): Promise<AuthUser>;
  logout(): Promise<void>;
  currentUser(): Promise<AuthUser | null>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
};
