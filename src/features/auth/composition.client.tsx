"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { httpClient } from "@/shared/infrastructure/http/client";
import { createAuthUseCases } from "./application/auth-use-cases";
import { createBrowserAuthGateway } from "./infrastructure/browser-auth-gateway";
import { ForgotPasswordScreen } from "./presentation/forgot-password-screen";
import { LoginScreen } from "./presentation/login-screen";
import { LogoutButton } from "./presentation/logout-button";
import { RegisterScreen } from "./presentation/register-screen";
import { ResetPasswordScreen } from "./presentation/reset-password-screen";

const useCases = createAuthUseCases(createBrowserAuthGateway(httpClient));

export function LoginFeature({ error }: { error?: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (
    <LoginScreen
      initialError={
        error === "google"
          ? "Masuk dengan Google gagal. Coba lagi, atau masuk dengan email."
          : null
      }
      onGoogle={() => window.location.assign("/api/auth/google")}
      useCases={useCases}
      onSignedIn={() => {
        // QueryClient lives across client-side navigations. Drop all
        // user-scoped server data before entering a newly authenticated
        // session so another account can never inherit the previous cache.
        queryClient.removeQueries();
        router.replace("/beranda");
      }}
      onRegister={() => router.push("/daftar")}
      onForgotPassword={() => router.push("/lupa-sandi")}
    />
  );
}

export function ForgotPasswordFeature() {
  const router = useRouter();
  return (
    <ForgotPasswordScreen
      useCases={useCases}
      onBackToLogin={() => router.push("/masuk")}
    />
  );
}

export function ResetPasswordFeature({ token }: { token: string }) {
  const router = useRouter();
  return (
    <ResetPasswordScreen
      useCases={useCases}
      token={token}
      onLogin={() => router.replace("/masuk")}
      onRequestNewLink={() => router.push("/lupa-sandi")}
    />
  );
}

export function RegisterFeature() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (
    <RegisterScreen
      useCases={useCases}
      onGoogle={() => window.location.assign("/api/auth/google")}
      onRegistered={() => {
        queryClient.removeQueries();
        router.replace("/beranda");
      }}
      onLogin={() => router.push("/masuk")}
    />
  );
}

export function SignOutAction() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (
    <LogoutButton
      useCases={useCases}
      onSignedOut={() => {
        // React Query's browser client survives route changes. Remove every
        // cached server response before leaving the authenticated session.
        queryClient.removeQueries();
        // replace(), not push(): the guarded page must not come back on Back.
        router.replace("/masuk");
        router.refresh();
      }}
    />
  );
}
