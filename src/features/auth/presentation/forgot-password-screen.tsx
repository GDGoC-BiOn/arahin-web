"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/shared/presentation/form/text-field";
import type { AuthUseCases } from "../application/auth-use-cases";
import { AuthAlert } from "./auth-alert";
import { AuthButton } from "./auth-button";
import {
  type ForgotPasswordFormValues,
  forgotPasswordFormSchema,
} from "./auth-form-schemas";
import { AuthFooterLink, AuthShell } from "./auth-shell";
import { PasswordResetDone } from "./password-reset-done";
import { useAuthSubmit } from "./use-auth-submit";

export function ForgotPasswordScreen({
  useCases,
  onBackToLogin,
}: {
  useCases: AuthUseCases;
  onBackToLogin: () => void;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: "" },
  });

  const { submit, error, pending } = useAuthSubmit<ForgotPasswordFormValues>({
    action: (values) => useCases.requestPasswordReset(values.email),
    onSuccess: () => setSentTo(getValues("email").trim()),
  });

  return (
    <AuthShell
      title={sentTo ? "Cek email kamu" : "Lupa kata sandi?"}
      subtitle={
        sentTo
          ? "Tautan untuk mengatur ulang kata sandi sudah dikirim."
          : "Masukkan email akun kamu. Kami kirimkan tautan untuk mengatur ulang kata sandi."
      }
      footer={
        <AuthFooterLink
          prompt="Ingat kata sandi?"
          action="Masuk"
          onClick={onBackToLogin}
        />
      }
    >
      {sentTo ? (
        // Worded the same whether or not the account exists, as the backend
        // is: the screen must not reveal who has an account.
        <PasswordResetDone
          body={`Jika ${sentTo} terdaftar, tautan reset sudah dikirim ke email tersebut. Tautan berlaku selama 1 jam.`}
          action="Kembali ke Masuk"
          onAction={onBackToLogin}
        />
      ) : (
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
            <AuthAlert message={error} />
          </div>
          <AuthButton
            label="Kirim Tautan Reset"
            pendingLabel="Mengirim…"
            pending={pending}
          />
        </form>
      )}
    </AuthShell>
  );
}
