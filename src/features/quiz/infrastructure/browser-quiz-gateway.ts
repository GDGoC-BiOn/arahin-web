import type { AxiosInstance } from "axios";
import { z } from "zod";
import type { AttemptResult, QuizDetail } from "../domain/quiz";
import type { QuizGateway } from "../domain/quiz-gateway";

const quizOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const quizItemSchema = z.object({
  id: z.string(),
  orderIndex: z.number(),
  question: z.string(),
  options: z.array(quizOptionSchema).default([]),
});

const quizDetailSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  title: z.string(),
  passingScore: z.number(),
  itemCount: z.number(),
  items: z.array(quizItemSchema).default([]),
});

const citationSchema = z.object({
  source: z.string().optional(),
  pdfPage: z.number().optional(),
  slidePage: z.number().optional(),
});

const answerFeedbackSchema = z.object({
  itemId: z.string(),
  chosenOptionId: z.string(),
  correctOptionId: z.string(),
  isCorrect: z.boolean(),
  explanation: z.string().default(""),
  citation: citationSchema.optional(),
});

const attemptResultSchema = z.object({
  attemptId: z.string(),
  quizId: z.string().default(""),
  score: z.number(),
  correctCount: z.number(),
  totalItems: z.number(),
  isPassed: z.boolean(),
  passingScore: z.number().default(0),
  dailyStreak: z.number().default(0),
  lessonCompleted: z.boolean().default(false),
  xpEarned: z.number().optional(),
  answers: z.array(answerFeedbackSchema).optional(),
  mastery: z.number().optional(),
  reviewDueAt: z.string().optional(),
  reviewIntervalDays: z.number().optional(),
});

export function createBrowserQuizGateway(client: AxiosInstance): QuizGateway {
  return {
    async loadQuiz(quizId: string): Promise<QuizDetail> {
      const { data } = await client.get(
        `/quizzes/${encodeURIComponent(quizId)}`,
      );
      return quizDetailSchema.parse(data);
    },
    async submit({ source, answers }): Promise<AttemptResult> {
      if (source.kind === "activity") {
        const { data } = await client.post(
          `/lessons/${encodeURIComponent(source.lessonId)}/activities/${encodeURIComponent(source.activityId)}/submit`,
          { answers },
        );
        return attemptResultSchema.parse(data);
      }
      const { data } = await client.post("/quiz-attempts", {
        quizId: source.quizId,
        answers,
      });
      return attemptResultSchema.parse(data);
    },
  };
}
