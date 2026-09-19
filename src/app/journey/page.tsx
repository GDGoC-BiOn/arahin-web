import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import { listSpacesFromCookie } from "@/features/ingestion/composition.server";
import { AppPanel } from "@/shared/presentation/layout/app-panel";

export const metadata: Metadata = { title: "Journey — ArahIn" };
export const dynamic = "force-dynamic";

/**
 * There is no Figma screen for the Journey tab itself — the design covers a
 * single space's session timeline. So this resolves the tab to the newest
 * space that actually has generated sessions and hands off to that timeline,
 * rather than inventing a list screen.
 */
export default async function JourneyPage() {
  const cookie = (await headers()).get("cookie");
  const user = await currentUserFromCookie(cookie);
  if (!user) redirect("/masuk");

  const spaces = await listSpacesFromCookie(cookie);
  const withSessions = spaces.find((space) => space.hasTracks);
  if (withSessions) redirect(`/ruang/${withSessions.id}`);

  return (
    <AppPanel>
      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <h1 className="text-base font-bold text-ink">Belum ada perjalanan</h1>
        <p className="text-xs leading-[1.5] text-subtle">
          {spaces.length === 0
            ? "Unggah dokumen pertama kamu untuk mulai belajar."
            : "Dokumen kamu belum diproses menjadi materi belajar."}
        </p>
        <Link
          href="/beranda"
          className="rounded-[20px] bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Ke Beranda
        </Link>
      </main>
    </AppPanel>
  );
}
