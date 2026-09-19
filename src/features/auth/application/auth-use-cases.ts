import type { AuthGateway } from "../domain/auth-gateway";
import type { AuthUser } from "../domain/auth-user";
import {
  type LoginCredentials,
  normalizeEmail,
  normalizeFullName,
  type RegisterCredentials,
} from "../domain/credentials";

export function createAuthUseCases(gateway: AuthGateway) {
  return {
    signIn(credentials: LoginCredentials): Promise<AuthUser> {
      return gateway.login({
        email: normalizeEmail(credentials.email),
        password: credentials.password,
      });
    },
    signUp(credentials: RegisterCredentials): Promise<AuthUser> {
      return gateway.register({
        email: normalizeEmail(credentials.email),
        password: credentials.password,
        fullName: normalizeFullName(credentials.fullName),
      });
    },
    signOut(): Promise<void> {
      return gateway.logout();
    },
    requestPasswordReset(email: string): Promise<void> {
      return gateway.requestPasswordReset(normalizeEmail(email));
    },
    resetPassword(token: string, newPassword: string): Promise<void> {
      return gateway.resetPassword(token.trim(), newPassword);
    },
    loadCurrentUser(): Promise<AuthUser | null> {
      return gateway.currentUser();
    },
  };
}

export type AuthUseCases = ReturnType<typeof createAuthUseCases>;
