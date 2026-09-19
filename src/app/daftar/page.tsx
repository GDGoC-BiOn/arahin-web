import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterFeature } from "@/features/auth/composition.client";
import { currentUserFromCookie } from "@/features/auth/composition.server";

export const metadata: Metadata = { title: "Daftar — ArahIn" };

export const dynamic = "force-dynamic";

/** Already signed in: there is nothing to do here, so go home. */
export default async function DaftarPage() {
  if (await currentUserFromCookie((await headers()).get("cookie"))) {
    redirect("/beranda");
  }
  return <RegisterFeature />;
}
