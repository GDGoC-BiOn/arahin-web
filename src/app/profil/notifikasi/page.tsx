import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import { NotificationsFeature } from "@/features/profile/composition.client";

export const metadata: Metadata = { title: "Notifikasi — ArahIn" };
export const dynamic = "force-dynamic";

export default async function NotifikasiPage() {
  const user = await currentUserFromCookie((await headers()).get("cookie"));
  if (!user) redirect("/masuk");
  return <NotificationsFeature />;
}
