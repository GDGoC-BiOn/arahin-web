import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginFeature } from "@/features/auth/composition.client";
import { currentUserFromCookie } from "@/features/auth/composition.server";

export const metadata: Metadata = { title: "Masuk — ArahIn" };

export const dynamic = "force-dynamic";

/** Already signed in: there is nothing to do here, so go home. */
export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentUserFromCookie((await headers()).get("cookie"))) {
    redirect("/beranda");
  }
  const { error } = await searchParams;
  return <LoginFeature error={error ?? null} />;
}
