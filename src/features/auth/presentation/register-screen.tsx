"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordField } from "@/shared/presentation/form/password-field";
import { TextField } from "@/shared/presentation/form/text-field";
import type { AuthUseCases } from "../application/auth-use-cases";
import { PASSWORD_MIN_LENGTH } from "../domain/credentials";
import { AuthAlert } from "./auth-alert";
import { AuthButton } from "./auth-button";
import { AuthDivider } from "./auth-chrome";
import {
  type RegisterFormValues,
  registerFormSchema,
} from "./auth-form-schemas";
import { AuthFooterLink, AuthShell, ComingSoonNote } from "./auth-shell";
import { SocialButtons } from "./social-buttons";
import { useAuthSubmit } from "./use-auth-submit";

export function RegisterScreen({
  useCases,
  onRegistered,
  onLogin,
  onGoogle,
}: {
  useCases: AuthUseCases;
  onRegistered: () => void;
  onLogin: () => void;
  onGoogle: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const { submit, error, pending } = useAuthSubmit<RegisterFormValues>({
    action: (values) => useCases.signUp(values),
    onSuccess: onRegistered,
  });

  return (
    <AuthShell
      title="Daftar Arahin secara Simple"
      subtitle="Buat akun kamu untuk melanjutkan"
      footer={
        <AuthFooterLink
          prompt="Sudah punya akun?"
          action="Masuk"
          onClick={onLogin}
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
            {...register("fullName")}
            label="Nama Lengkap"
            autoComplete="name"
            placeholder="Nama lengkap kamu"
            error={errors.fullName?.message}
            disabled={pending}
          />
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
            label="Buat Kata Sandi"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            hint={`Gunakan minimal ${PASSWORD_MIN_LENGTH} karakter.`}
            error={errors.password?.message}
            disabled={pending}
          />
          <AuthAlert message={error} />
        </div>
        <div className="flex flex-col gap-6">
          <AuthButton
            label="Daftar"
            pendingLabel="Sedang membuat akun…"
            pending={pending}
          />
          <ComingSoonNote>
            <AuthDivider label="Atau" />
            <SocialButtons
              available={["google"]}
              disabled={pending || leaving}
              onSelect={(provider) => {
                if (provider !== "google") return;
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
