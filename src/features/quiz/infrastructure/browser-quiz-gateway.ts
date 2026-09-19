import type { AxiosInstance } from "axios";
import type { AttemptResult, QuizDetail } from "../domain/quiz";
import type { QuizGateway } from "../domain/quiz-gateway";

export function createBrowserQuizGateway(client: AxiosInstance): QuizGateway {
  return {
    async loadQuiz(quizId: string): Promise<QuizDetail> {
      const { data } = await client.get<QuizDetail>(`/quizzes/${quizId}`);
      return { ...data, items: data.items ?? [] };
    },
    async submit({ source, answers }): Promise<AttemptResult> {
      if (source.kind === "activity") {
        const { data } = await client.post<AttemptResult>(
          `/lessons/${encodeURIComponent(source.lessonId)}/activities/${encodeURIComponent(source.activityId)}/submit`,
          { answers },
        );
        return data;
      }
      const { data } = await client.post<AttemptResult>("/quiz-attempts", {
        quizId: source.quizId,
        answers,
      });
      return data;
    },
  };
}
