import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import { HomeFeature } from "@/features/ingestion/composition.client";

export const metadata: Metadata = { title: "Beranda — ArahIn" };
export const dynamic = "force-dynamic";

export default async function BerandaPage() {
  const user = await currentUserFromCookie((await headers()).get("cookie"));
  // Guarded server-side so a signed-out visitor never sees a flash of the page.
  if (!user) redirect("/masuk");

  return <HomeFeature greetingName={user.fullName} />;
}
