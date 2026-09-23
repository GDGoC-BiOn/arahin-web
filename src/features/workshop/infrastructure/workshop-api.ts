import { z } from "zod";
import { httpClient } from "@/shared/infrastructure/http/client";
import type {
  WorkshopApi,
  WorkshopAttemptResult,
  WorkshopQuiz,
  WorkshopQuizDetail,
  WorkshopQuizSource,
  WorkshopSpace,
  WorkshopTrack,
} from "../domain/workshop";

const spaceSchema = z.object({
  id: z.string(),
  title: z.string(),
  hasTracks: z.boolean().default(false),
});

const spacesEnvelopeSchema = z.object({
  learningSpaces: z.array(spaceSchema).default([]),
});

const lessonSchema = z.object({
  id: z.string(),
  orderIndex: z.number(),
  title: z.string(),
  status: z.string().optional(),
  completedAt: z.string().nullable().optional(),
});

const trackSchema = z.object({
  id: z.string(),
  orderIndex: z.number(),
  title: z.string(),
  lessons: z.array(lessonSchema).default([]),
});

const tracksEnvelopeSchema = z.object({
  tracks: z.array(trackSchema).default([]),
});

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

const quizSourceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("activity"),
    lessonId: z.string(),
    activityId: z.string(),
  }),
  z.object({
    kind: z.literal("quiz"),
    quizId: z.string(),
  }),
]);

const quizBootstrapSchema = z.object({
  source: quizSourceSchema,
  quiz: quizDetailSchema.nullable(),
});

const feedbackSchema = z.object({
  itemId: z.string(),
  chosenOptionId: z.string(),
  correctOptionId: z.string(),
  isCorrect: z.boolean(),
  explanation: z.string().default(""),
});

const attemptResultSchema = z.object({
  score: z.number(),
  correctCount: z.number(),
  totalItems: z.number(),
  isPassed: z.boolean(),
  answers: z.array(feedbackSchema).optional(),
});

export const workshopApi: WorkshopApi = {
  async listSpaces(): Promise<WorkshopSpace[]> {
    const { data } = await httpClient.get("/spaces");
    return spacesEnvelopeSchema.parse(data).learningSpaces;
  },

  async loadTracks(spaceId: string): Promise<WorkshopTrack[]> {
    const { data } = await httpClient.get(
      `/spaces/${encodeURIComponent(spaceId)}/tracks`,
    );
    return tracksEnvelopeSchema.parse(data).tracks;
  },

  async loadQuiz(spaceId: string, lessonId: string): Promise<WorkshopQuiz> {
    const { data } = await httpClient.get(
      `/workshop/spaces/${encodeURIComponent(spaceId)}/lessons/${encodeURIComponent(lessonId)}/quiz`,
    );
    const bootstrap = quizBootstrapSchema.parse(data);

    if (bootstrap.quiz) {
      return {
        source: bootstrap.source as WorkshopQuizSource,
        quiz: bootstrap.quiz as WorkshopQuizDetail,
      };
    }

    if (bootstrap.source.kind !== "quiz") {
      throw new Error("Quiz bootstrap did not include quiz data.");
    }

    const response = await httpClient.get(
      `/quizzes/${encodeURIComponent(bootstrap.source.quizId)}`,
    );

    return {
      source: bootstrap.source,
      quiz: quizDetailSchema.parse(response.data),
    };
  },

  async submitQuiz(input): Promise<WorkshopAttemptResult> {
    if (input.source.kind === "activity") {
      const { data } = await httpClient.post(
        `/lessons/${encodeURIComponent(input.source.lessonId)}/activities/${encodeURIComponent(input.source.activityId)}/submit`,
        { answers: input.answers },
      );
      return attemptResultSchema.parse(data);
    }

    const { data } = await httpClient.post("/quiz-attempts", {
      quizId: input.source.quizId,
      answers: input.answers,
    });
    return attemptResultSchema.parse(data);
  },
};
