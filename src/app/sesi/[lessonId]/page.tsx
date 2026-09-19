import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import {
  lessonFromCookie,
  spaceFromCookie,
} from "@/features/journey/composition.server";
import { ReaderFeature } from "@/features/reader/composition.client";
import { NotFoundPanel } from "../../_components/not-found-panel";

export const metadata: Metadata = { title: "Materi — ArahIn" };
export const dynamic = "force-dynamic";

/**
 * A session is read first, then quizzed. The lesson is resolved here — the
 * reader and quiz features never need to know lessons exist as an endpoint.
 */
export default async function SesiPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ ruang?: string }>;
}) {
  const cookie = (await headers()).get("cookie");
  const user = await currentUserFromCookie(cookie);
  if (!user) redirect("/masuk");

  const { lessonId } = await params;
  const { ruang } = await searchParams;
  const [lesson, space] = await Promise.all([
    lessonFromCookie(cookie, lessonId),
    // Only labels the header, so a failure here must never cost the lesson.
    ruang ? spaceFromCookie(cookie, ruang).catch(() => null) : null,
  ]);

  if (!lesson) {
    return (
      <NotFoundPanel
        title="Sesi tidak ditemukan"
        message="Materinya belum dibuat, atau sesi ini bukan milik kamu."
        backHref={ruang ? `/ruang/${ruang}` : "/beranda"}
      />
    );
  }

  return (
    <ReaderFeature
      lessonId={lesson.id}
      title={lesson.title}
      contentMarkdown={lesson.contentMarkdown}
      hasQuiz={lesson.quizzes.length > 0}
      spaceId={ruang ?? null}
      sourceType={space?.sourceType || null}
    />
  );
}
