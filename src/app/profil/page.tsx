import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutAction } from "@/features/auth/composition.client";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import { ProfileFeature } from "@/features/profile/composition.client";

export const metadata: Metadata = { title: "Profil — ArahIn" };
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await currentUserFromCookie((await headers()).get("cookie"));
  if (!user) redirect("/masuk");

  // The profile feature may not import auth, so the sign-out control is
  // injected here — the one place allowed to see both compositions.
  return (
    <ProfileFeature
      fallbackName={user.fullName}
      signOutSlot={<SignOutAction />}
    />
  );
}
