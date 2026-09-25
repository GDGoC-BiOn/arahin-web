import type {
  AttemptResult,
  QuizAnswer,
  QuizDetail,
  QuizItem,
  QuizSource,
} from "../domain/quiz";
import type { QuizGateway } from "../domain/quiz-gateway";
import type { QuizSession } from "../domain/quiz-session";

export function createQuizUseCases(gateway: QuizGateway) {
  return {
    loadQuiz(quizId: string): Promise<QuizDetail> {
      return gateway.loadQuiz(quizId);
    },

    /**
     * Grades the whole quiz in one call, because that is the only thing the
     * backend offers: it scores against every item and returns aggregates.
     * Submitting item-by-item would score each answer out of the full total
     * and write an attempt row per question.
     */
    async submit(input: {
      source: QuizSource;
      session: QuizSession;
      items: QuizItem[];
      spaceId: string | null;
      lessonId: string;
    }): Promise<AttemptResult> {
      // TODO 3 (workshop): turn UI/form state into the backend transport
      // contract: [{ itemId, optionId }].
      //
      // Keep quiz item order and only include answered items.
      const answers: QuizAnswer[] = [];

      // The backend records lesson completion itself; the timeline reads it
      // back from the tracks endpoint.
      return gateway.submit({
        source: input.source,
        answers,
      });
    },
  };
}

export type QuizUseCases = ReturnType<typeof createQuizUseCases>;
