import type { Metadata } from "next";
import { ForgotPasswordFeature } from "@/features/auth/composition.client";

export const metadata: Metadata = { title: "Lupa Kata Sandi — ArahIn" };

export default function LupaSandiPage() {
  return <ForgotPasswordFeature />;
}
