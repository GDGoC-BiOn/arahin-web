import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import { lessonFromCookie } from "@/features/journey/composition.server";
import { SlidesFeature } from "@/features/reader/composition.client";
import { NotFoundPanel } from "../../../_components/not-found-panel";

export const metadata: Metadata = { title: "Materi PPT — ArahIn" };
export const dynamic = "force-dynamic";

export default async function SlidePage({
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
  const lesson = await lessonFromCookie(cookie, lessonId);
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
    <SlidesFeature
      lessonId={lesson.id}
      title={lesson.title}
      contentMarkdown={lesson.contentMarkdown}
      hasQuiz={lesson.quizzes.length > 0}
      spaceId={ruang ?? null}
    />
  );
}
