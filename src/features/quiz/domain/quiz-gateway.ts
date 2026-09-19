import type { AttemptResult, QuizAnswer, QuizDetail, QuizSource } from "./quiz";

export type QuizGateway = {
  loadQuiz(quizId: string): Promise<QuizDetail>;
  submit(input: {
    source: QuizSource;
    answers: QuizAnswer[];
  }): Promise<AttemptResult>;
};
