import type { AxiosInstance } from "axios";
import { z } from "zod";
import type { JourneyGateway } from "../domain/journey-gateway";
import type { ProgressiveGenerationJob } from "../domain/progressive-generation";
import type { TrackSummary } from "../domain/session";

const lessonSchema = z.object({
  id: z.string(),
  orderIndex: z.number(),
  title: z.string(),
  quizCount: z.number().default(0),
  status: z.string().optional(),
  completedAt: z.string().nullable().optional(),
});

const trackSchema = z.object({
  id: z.string(),
  orderIndex: z.number(),
  title: z.string(),
  description: z.string().optional(),
  lessons: z.array(lessonSchema).default([]),
});

const tracksEnvelopeSchema = z.object({
  tracks: z.array(trackSchema).default([]),
});

const masteryEnvelopeSchema = z.object({
  journeys: z
    .array(
      z.object({
        mastery: z.number().optional(),
      }),
    )
    .optional(),
});

const generatedLessonSchema = z.object({
  conceptId: z.string(),
  orderIndex: z.number(),
  status: z.enum([
    "pending",
    "running",
    "completed",
    "retryable_failed",
    "terminal_failed",
    "aborted",
  ]),
  title: z.string().optional(),
  contentMarkdown: z.string().optional(),
});

const generationSchema = z.object({
  generationId: z.string(),
  spaceId: z.string(),
  status: z.enum(["queued", "running", "completed", "failed", "cancelled"]),
  stage: z.string(),
  progress: z.object({
    completed: z.number(),
    total: z.number(),
  }),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  lessons: z.array(generatedLessonSchema).optional(),
});

export function createBrowserJourneyGateway(
  client: AxiosInstance,
): JourneyGateway {
  return {
    async loadTracks(spaceId: string): Promise<TrackSummary[]> {
      const { data } = await client.get(
        `/spaces/${encodeURIComponent(spaceId)}/tracks`,
      );
      return tracksEnvelopeSchema.parse(data).tracks;
    },
    async loadMastery(spaceId: string): Promise<number | null> {
      const { data } = await client.get(
        `/spaces/${encodeURIComponent(spaceId)}/journeys`,
      );
      const parsed = masteryEnvelopeSchema.parse(data);
      const mastery = parsed.journeys?.[0]?.mastery;
      return typeof mastery === "number" ? mastery : null;
    },
    async loadGeneration(
      spaceId: string,
      generationId: string,
    ): Promise<ProgressiveGenerationJob> {
      const { data } = await client.get(
        `/spaces/${encodeURIComponent(spaceId)}/blueprint/generations/${encodeURIComponent(generationId)}`,
      );
      return generationSchema.parse(data);
    },
  };
}
