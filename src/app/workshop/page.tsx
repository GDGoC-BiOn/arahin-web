import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import { WorkshopFeature } from "@/features/workshop/composition.client";

export const metadata: Metadata = {
  title: "Workshop Starter — ArahIn",
};

export const dynamic = "force-dynamic";

export default async function WorkshopPage() {
  const cookie = (await headers()).get("cookie");
  const user = await currentUserFromCookie(cookie);

  if (!user) redirect("/masuk");

  return <WorkshopFeature />;
}
