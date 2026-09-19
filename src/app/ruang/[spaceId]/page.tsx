import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import { JourneyFeature } from "@/features/journey/composition.client";
import { spaceFromCookie } from "@/features/journey/composition.server";
import { NotFoundPanel } from "../../_components/not-found-panel";

export const metadata: Metadata = { title: "Sesi Belajar — ArahIn" };
export const dynamic = "force-dynamic";

export default async function RuangPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const cookie = (await headers()).get("cookie");
  const user = await currentUserFromCookie(cookie);
  if (!user) redirect("/masuk");

  const { spaceId } = await params;
  if (!(await spaceFromCookie(cookie, spaceId))) {
    return (
      <NotFoundPanel
        title="Ruang belajar tidak ditemukan"
        message="Ruang ini sudah tidak ada, atau bukan milik kamu."
        backHref="/beranda"
      />
    );
  }
  return <JourneyFeature spaceId={spaceId} />;
}
