"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PasswordField } from "@/shared/presentation/form/password-field";
import type { AuthUseCases } from "../application/auth-use-cases";
import { AuthAlert } from "./auth-alert";
import { AuthButton } from "./auth-button";
import {
  type ResetPasswordFormValues,
  resetPasswordFormSchema,
} from "./auth-form-schemas";
import { AuthFooterLink, AuthShell } from "./auth-shell";
import { PasswordResetDone } from "./password-reset-done";
import { useAuthSubmit } from "./use-auth-submit";

export function ResetPasswordScreen({
  useCases,
  token,
  onLogin,
  onRequestNewLink,
}: {
  useCases: AuthUseCases;
  token: string;
  onLogin: () => void;
  onRequestNewLink: () => void;
}) {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const { submit, error, pending } = useAuthSubmit<ResetPasswordFormValues>({
    action: (values) => useCases.resetPassword(token, values.password),
    onSuccess: () => setDone(true),
  });

  const footer = (
    <AuthFooterLink
      prompt="Tautan bermasalah?"
      action="Minta tautan baru"
      onClick={onRequestNewLink}
    />
  );

  if (!token.trim()) {
    return (
      <AuthShell
        title="Tautan tidak lengkap"
        subtitle="Buka tautan reset langsung dari email kamu, atau minta tautan baru."
        footer={footer}
      >
        <AuthButton
          type="button"
          label="Minta Tautan Baru"
          pendingLabel="Minta Tautan Baru"
          pending={false}
          onClick={onRequestNewLink}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={done ? "Kata sandi diperbarui" : "Atur ulang kata sandi"}
      subtitle={
        done
          ? "Masuk dengan kata sandi baru kamu."
          : "Buat kata sandi baru untuk akun Arahin kamu."
      }
      footer={footer}
    >
      {done ? (
        <PasswordResetDone
          body="Kata sandi kamu berhasil diganti."
          action="Masuk"
          onAction={onLogin}
        />
      ) : (
        <form
          onSubmit={handleSubmit(submit)}
          noValidate
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-4">
            <PasswordField
              {...register("password")}
              label="Kata sandi baru"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              error={errors.password?.message}
              disabled={pending}
            />
            <PasswordField
              {...register("confirm")}
              label="Ulangi kata sandi baru"
              autoComplete="new-password"
              placeholder="Ketik ulang kata sandi"
              error={errors.confirm?.message}
              disabled={pending}
            />
            <AuthAlert message={error} />
          </div>
          <AuthButton
            label="Simpan Kata Sandi"
            pendingLabel="Menyimpan…"
            pending={pending}
          />
        </form>
      )}
    </AuthShell>
  );
}
