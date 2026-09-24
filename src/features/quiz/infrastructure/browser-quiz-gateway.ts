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

const legacyAttemptResultSchema = z.object({
  attemptId: z.string(),
  quizId: z.string(),
  score: z.number(),
  correctCount: z.number(),
  totalItems: z.number(),
  isPassed: z.boolean(),
  passingScore: z.number(),
  dailyStreak: z.number(),
  lessonCompleted: z.boolean(),
  xpEarned: z.number().optional(),
  answers: z.array(answerFeedbackSchema).optional(),
});

const activityResultSchema = z.object({
  activityId: z.string(),
  lessonId: z.string(),
  kind: z.string(),
  score: z.number(),
  correctCount: z.number(),
  totalItems: z.number(),
  isPassed: z.boolean(),
  passingScore: z.number(),
  mastery: z.number(),
  reviewIntervalDays: z.number(),
  reviewDueAt: z.string(),
  lessonCompleted: z.boolean(),
  xpEarned: z.number(),
  answers: z.array(answerFeedbackSchema),
});

function parseActivityResult(data: unknown): AttemptResult {
  const parsed = activityResultSchema.parse(data);
  return {
    // Activity submissions are not legacy quiz attempts, so they do not have
    // attemptId/quizId/dailyStreak. The shared presentation model keeps those
    // legacy fields populated with neutral values while preserving strict
    // validation of the activity response itself.
    attemptId: "",
    quizId: "",
    dailyStreak: 0,
    score: parsed.score,
    correctCount: parsed.correctCount,
    totalItems: parsed.totalItems,
    isPassed: parsed.isPassed,
    passingScore: parsed.passingScore,
    lessonCompleted: parsed.lessonCompleted,
    xpEarned: parsed.xpEarned,
    answers: parsed.answers,
    mastery: parsed.mastery,
    reviewDueAt: parsed.reviewDueAt,
    reviewIntervalDays: parsed.reviewIntervalDays,
  };
}

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
        return parseActivityResult(data);
      }
      const { data } = await client.post("/quiz-attempts", {
        quizId: source.quizId,
        answers,
      });
      return legacyAttemptResultSchema.parse(data);
    },
  };
}
