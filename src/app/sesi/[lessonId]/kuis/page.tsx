import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserFromCookie } from "@/features/auth/composition.server";
import {
  lessonActivityFromCookie,
  lessonFromCookie,
} from "@/features/journey/composition.server";
import { QuizFeature } from "@/features/quiz/composition.client";
import { AppPanel } from "@/shared/presentation/layout/app-panel";

export const metadata: Metadata = { title: "Kuis — ArahIn" };
export const dynamic = "force-dynamic";

export default async function KuisPage({
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
  const [lesson, activity] = await Promise.all([
    lessonFromCookie(cookie, lessonId),
    ruang ? lessonActivityFromCookie(cookie, ruang, lessonId) : null,
  ]);
  const quiz = lesson?.quizzes[0];

  if (!lesson || (!activity && !quiz)) {
    return (
      <AppPanel>
        <main
          id="main"
          className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <h1 className="text-base font-bold text-ink">Kuis belum siap</h1>
          <p className="text-xs leading-[1.5] text-subtle">
            Sesi ini belum punya kuis.
          </p>
          <Link
            href={ruang ? `/ruang/${ruang}` : "/beranda"}
            className="rounded-[20px] bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Kembali
          </Link>
        </main>
      </AppPanel>
    );
  }

  // Prefer the Activity: grading it also updates mastery and schedules a review.
  if (activity) {
    return (
      <QuizFeature
        source={{
          kind: "activity",
          lessonId: lesson.id,
          activityId: activity.activityId,
        }}
        initialQuiz={{
          id: activity.activityId,
          lessonId: lesson.id,
          title: activity.title,
          passingScore: 0,
          itemCount: activity.items.length,
          items: activity.items.map((item, index) => ({
            ...item,
            orderIndex: index + 1,
          })),
        }}
        lessonId={lesson.id}
        spaceId={ruang ?? null}
      />
    );
  }

  return (
    <QuizFeature
      source={{ kind: "quiz", quizId: quiz!.id }}
      lessonId={lesson.id}
      spaceId={ruang ?? null}
    />
  );
}
