import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import { EditProfileFeature } from "@/features/profile/composition.client";

export const metadata: Metadata = { title: "Edit Profil — ArahIn" };
export const dynamic = "force-dynamic";

export default async function EditProfilPage() {
  const user = await currentUserFromCookie((await headers()).get("cookie"));
  if (!user) redirect("/masuk");
  return <EditProfileFeature />;
}
