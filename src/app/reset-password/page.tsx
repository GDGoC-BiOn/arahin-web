import type { Metadata } from "next";
import { ResetPasswordFeature } from "@/features/auth/composition.client";

export const metadata: Metadata = { title: "Atur Ulang Kata Sandi — ArahIn" };
export const dynamic = "force-dynamic";

/**
 * The path is fixed by the backend: its reset email links to
 * `${APP_URL}/reset-password?token=…`.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <ResetPasswordFeature token={typeof token === "string" ? token : ""} />
  );
}
