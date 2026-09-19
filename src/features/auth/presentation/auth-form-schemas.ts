import { z } from "zod";
import {
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  passwordByteLength,
} from "../domain/credentials";

/**
 * Client-side copies of the backend's own rules (identity/routes.go), so a
 * mistake is caught before a round trip and the message is in the user's
 * language rather than the API's English.
 */
const email = z
  .string()
  .trim()
  .min(1, "Email wajib diisi.")
  .email("Masukkan alamat email yang valid.");

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const registerFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi.")
    .max(FULL_NAME_MAX_LENGTH, `Maksimal ${FULL_NAME_MAX_LENGTH} karakter.`),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Minimal ${PASSWORD_MIN_LENGTH} karakter.`)
    .refine(
      (value) => passwordByteLength(value) <= PASSWORD_MAX_BYTES,
      "Kata sandi terlalu panjang.",
    ),
});

export const forgotPasswordFormSchema = z.object({ email });

export const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Minimal ${PASSWORD_MIN_LENGTH} karakter.`)
      .refine(
        (value) => passwordByteLength(value) <= PASSWORD_MAX_BYTES,
        "Kata sandi terlalu panjang.",
      ),
    confirm: z.string().min(1, "Ulangi kata sandi baru."),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Kata sandi tidak sama.",
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
