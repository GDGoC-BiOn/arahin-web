"use client";

import { useRouter } from "next/navigation";
import { readerTitle } from "./domain/lesson-content";
import { ReaderScreen } from "./presentation/reader-screen";
import { SlidesScreen } from "./presentation/slides-screen";

export function ReaderFeature({
  lessonId,
  title,
  contentMarkdown,
  hasQuiz,
  spaceId,
  sourceType,
}: {
  lessonId: string;
  title: string;
  contentMarkdown: string;
  hasQuiz: boolean;
  spaceId: string | null;
  sourceType: string | null;
}) {
  const router = useRouter();
  const back = spaceId ? `/ruang/${spaceId}` : "/beranda";
  const slidesHref = spaceId
    ? `/sesi/${lessonId}/slide?ruang=${spaceId}`
    : `/sesi/${lessonId}/slide`;
  return (
    <ReaderScreen
      title={title}
      heading={readerTitle(sourceType)}
      downloadHref={`/api/lessons/${lessonId}/pdf`}
      contentMarkdown={contentMarkdown}
      hasQuiz={hasQuiz}
      onBack={() => router.push(back)}
      // Reading leads to the slide deck, and the deck to the quiz.
      onContinue={() => router.push(slidesHref)}
    />
  );
}

export function SlidesFeature({
  lessonId,
  title,
  contentMarkdown,
  hasQuiz,
  spaceId,
}: {
  lessonId: string;
  title: string;
  contentMarkdown: string;
  hasQuiz: boolean;
  spaceId: string | null;
}) {
  const router = useRouter();
  const suffix = spaceId ? `?ruang=${spaceId}` : "";
  const back = spaceId ? `/ruang/${spaceId}` : "/beranda";
  return (
    <SlidesScreen
      title={title}
      contentMarkdown={contentMarkdown}
      downloadHref={`/api/lessons/${lessonId}/ppt`}
      hasQuiz={hasQuiz}
      onBack={() => router.push(`/sesi/${lessonId}${suffix}`)}
      onContinue={() =>
        router.push(hasQuiz ? `/sesi/${lessonId}/kuis${suffix}` : back)
      }
    />
  );
}
