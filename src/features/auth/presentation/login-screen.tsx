"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordField } from "@/shared/presentation/form/password-field";
import { TextField } from "@/shared/presentation/form/text-field";
import type { AuthUseCases } from "../application/auth-use-cases";
import { AuthAlert } from "./auth-alert";
import { AuthButton } from "./auth-button";
import { AuthDivider } from "./auth-chrome";
import { type LoginFormValues, loginFormSchema } from "./auth-form-schemas";
import { AuthFooterLink, AuthShell, ComingSoonNote } from "./auth-shell";
import { SocialButtons } from "./social-buttons";
import { useAuthSubmit } from "./use-auth-submit";

export function LoginScreen({
  useCases,
  onSignedIn,
  onRegister,
  onForgotPassword,
  onGoogle,
  initialError = null,
}: {
  useCases: AuthUseCases;
  onSignedIn: () => void;
  onRegister: () => void;
  onForgotPassword: () => void;
  onGoogle: () => void;
  /** Set when a Google sign-in bounced back here. */
  initialError?: string | null;
}) {
  const [leaving, setLeaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const { submit, error, pending } = useAuthSubmit<LoginFormValues>({
    action: (values) => useCases.signIn(values),
    onSuccess: onSignedIn,
  });

  return (
    <AuthShell
      title="Masuk ke akun Arahin kamu"
      subtitle="Masukkan email dan kata sandi Anda untuk masuk"
      footer={
        <AuthFooterLink
          prompt="Belum punya akun?"
          action="Daftar"
          onClick={onRegister}
        />
      }
    >
      <form
        onSubmit={handleSubmit(submit)}
        noValidate
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4">
          <TextField
            {...register("email")}
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nama@email.com"
            error={errors.email?.message}
            disabled={pending}
          />
          <PasswordField
            {...register("password")}
            label="Password"
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            error={errors.password?.message}
            disabled={pending}
          />
          <button
            type="button"
            onClick={onForgotPassword}
            className="self-end text-xs font-semibold text-primary-500"
          >
            Lupa Kata Sandi ?
          </button>
          <AuthAlert message={error ?? initialError} />
        </div>
        <div className="flex flex-col gap-6">
          <AuthButton
            label="Masuk"
            pendingLabel="Sedang masuk…"
            pending={pending}
          />
          <ComingSoonNote>
            <AuthDivider label="Atau" />
            <SocialButtons
              available={["google"]}
              disabled={pending || leaving}
              onSelect={(provider) => {
                if (provider !== "google") return;
                // A full navigation to Google; keep the buttons settled until
                // the page actually unloads.
                setLeaving(true);
                onGoogle();
              }}
            />
          </ComingSoonNote>
        </div>
      </form>
    </AuthShell>
  );
}
