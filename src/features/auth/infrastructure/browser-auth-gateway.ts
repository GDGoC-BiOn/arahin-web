import type { AxiosInstance } from "axios";
import type { AuthGateway } from "../domain/auth-gateway";
import type { AuthUser } from "../domain/auth-user";
import type {
  LoginCredentials,
  RegisterCredentials,
} from "../domain/credentials";

/**
 * Talks to this app's own `/api/auth/*` proxy, never to the Go backend
 * directly. The token stays in an httpOnly cookie the browser sends
 * automatically, so nothing here handles it.
 */
export function createBrowserAuthGateway(client: AxiosInstance): AuthGateway {
  return {
    async login(credentials: LoginCredentials): Promise<AuthUser> {
      const { data } = await client.post<{ user: AuthUser }>(
        "/auth/login",
        credentials,
      );
      return data.user;
    },
    async register(credentials: RegisterCredentials): Promise<AuthUser> {
      const { data } = await client.post<{ user: AuthUser }>(
        "/auth/register",
        credentials,
      );
      return data.user;
    },
    async logout(): Promise<void> {
      await client.post("/auth/logout");
    },
    async requestPasswordReset(email: string): Promise<void> {
      await client.post("/auth/forgot-password", { email });
    },
    async resetPassword(token: string, newPassword: string): Promise<void> {
      await client.post("/auth/reset-password", { token, newPassword });
    },
    async currentUser(): Promise<AuthUser | null> {
      const { data } = await client.get<{ user: AuthUser | null }>("/auth/me");
      return data.user;
    },
  };
}
