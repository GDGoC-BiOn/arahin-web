"use client";

import { useRouter } from "next/navigation";
import { httpClient } from "@/shared/infrastructure/http/client";
import { createQuizUseCases } from "./application/quiz-use-cases";
import type { QuizDetail, QuizSource } from "./domain/quiz";
import { createBrowserQuizGateway } from "./infrastructure/browser-quiz-gateway";
import { QuizScreen } from "./presentation/quiz-screen";

const useCases = createQuizUseCases(createBrowserQuizGateway(httpClient));

export function QuizFeature({
  source,
  initialQuiz = null,
  lessonId,
  spaceId,
}: {
  source: QuizSource;
  initialQuiz?: QuizDetail | null;
  lessonId: string;
  spaceId: string | null;
}) {
  const router = useRouter();
  // Back to the timeline the session came from; falling back to Beranda when
  // the space was not carried in the URL.
  const back = spaceId ? `/ruang/${spaceId}` : "/beranda";
  return (
    <QuizScreen
      useCases={useCases}
      source={source}
      initialQuiz={initialQuiz}
      lessonId={lessonId}
      spaceId={spaceId}
      onBack={() => router.push(back)}
      onSignIn={() => router.push("/masuk")}
      onFinish={() => {
        router.push(back);
        // The timeline reads completion from the server on mount; refresh so
        // the lesson just passed shows as done.
        router.refresh();
      }}
    />
  );
}
