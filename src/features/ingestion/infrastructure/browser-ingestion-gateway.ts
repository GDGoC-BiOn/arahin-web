import type { AxiosInstance } from "axios";
import { z } from "zod";
import type { GenerationJob } from "../domain/generation-job";
import type { IngestionGateway } from "../domain/ingestion-gateway";
import type {
  CreatedSpace,
  DueReview,
  SpaceProgress,
  SpaceSummary,
  UploadedSource,
} from "../domain/learning-space";

const createdSpaceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  createdAt: z.string(),
});

const uploadedSourceSchema = z.object({
  id: z.string(),
  originalFileName: z.string(),
  fileType: z.string(),
  markdownChars: z.number(),
  imageCount: z.number(),
  duplicate: z.boolean(),
  pages: z.number(),
});

const generatedBlueprintSchema = z.object({
  conceptCount: z.number(),
  trackCount: z.number(),
  lessonCount: z.number(),
  quizCount: z.number(),
  quizItemCount: z.number(),
  sourceCount: z.number(),
  isStub: z.boolean(),
});

const generationLessonSchema = z.object({
  conceptId: z.string(),
  orderIndex: z.number(),
  status: z.enum([
    "pending",
    "running",
    "completed",
    "failed",
    "retryable_failed",
    "terminal_failed",
    "aborted",
  ]),
  title: z.string().optional(),
  contentMarkdown: z.string().optional(),
});

const generationJobSchema = z.object({
  generationId: z.string(),
  spaceId: z.string(),
  status: z.enum(["queued", "running", "completed", "failed", "cancelled"]),
  stage: z.enum([
    "parsing",
    "chunking",
    "extracting_blueprint",
    "reconciling",
    "validating",
    "generating_lessons",
    "finalizing",
  ]),
  progress: z.object({
    completed: z.number(),
    total: z.number(),
  }),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  result: generatedBlueprintSchema.optional(),
  lessons: z.array(generationLessonSchema).optional(),
});

const dueReviewSchema = z.object({
  reviewId: z.string(),
  activityId: z.string(),
  activityTitle: z.string(),
  lessonId: z.string(),
  lessonTitle: z.string(),
  spaceId: z.string(),
  spaceTitle: z.string(),
  dueAt: z.string(),
  intervalDays: z.number(),
});

const reviewsEnvelopeSchema = z.object({
  reviews: z.array(dueReviewSchema).default([]),
});

const spaceSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  sourceType: z.string(),
  estimatedHours: z.number().default(0),
  difficultyLevel: z.string().default(""),
  sourceCount: z.number().default(0),
  hasTracks: z.boolean().default(false),
  createdAt: z.string(),
});

const spacesEnvelopeSchema = z.object({
  learningSpaces: z.array(spaceSummarySchema).default([]),
});

const progressSchema = z.object({
  id: z.string(),
  title: z.string(),
  totalLessons: z.number().default(0),
  completedLessons: z.number().default(0),
  progressPercent: z.number().default(0),
});

const progressEnvelopeSchema = z.object({
  spaces: z.array(progressSchema).default([]),
});

/**
 * Hits this app's own proxy routes. The session token rides along in the
 * httpOnly cookie, so nothing here touches auth.
 *
 * Timeouts are per-request and generous: the backend's own router allows 165s
 * for a parse and the blueprint call is slower still, so the shared 10s
 * default on the axios instance would abort work the server is still doing.
 */
const UPLOAD_TIMEOUT_MS = 175_000;

export function createBrowserIngestionGateway(
  client: AxiosInstance,
): IngestionGateway {
  return {
    async createSpace(input): Promise<CreatedSpace> {
      const { data } = await client.post("/spaces", input);
      return createdSpaceSchema.parse(data);
    },

    async uploadSource({
      spaceId,
      file,
      onUploadProgress,
    }): Promise<UploadedSource> {
      const form = new FormData();
      form.append("file", file);
      const { data } = await client.post(
        `/spaces/${encodeURIComponent(spaceId)}/sources`,
        form,
        {
          timeout: UPLOAD_TIMEOUT_MS,
          onUploadProgress: (event) => {
            if (!onUploadProgress) return;
            if (typeof event.total !== "number" || event.total <= 0) return;
            onUploadProgress(Math.min(event.loaded / event.total, 1));
          },
        },
      );
      return uploadedSourceSchema.parse(data);
    },

    async startBlueprintGeneration(spaceId): Promise<GenerationJob> {
      const { data } = await client.post(
        `/spaces/${encodeURIComponent(spaceId)}/blueprint/generations`,
      );
      return generationJobSchema.parse(data);
    },

    async getBlueprintGeneration(
      spaceId,
      generationId,
    ): Promise<GenerationJob> {
      const { data } = await client.get(
        `/spaces/${encodeURIComponent(spaceId)}/blueprint/generations/${encodeURIComponent(generationId)}`,
      );
      return generationJobSchema.parse(data);
    },

    async listDueReviews(): Promise<DueReview[]> {
      const { data } = await client.get("/reviews/active");
      return reviewsEnvelopeSchema.parse(data).reviews;
    },

    async listSpaces(query?: string): Promise<SpaceSummary[]> {
      const { data } = await client.get("/spaces", {
        params: query ? { q: query } : undefined,
      });
      return spacesEnvelopeSchema.parse(data).learningSpaces;
    },

    async listProgress(): Promise<SpaceProgress[]> {
      const { data } = await client.get("/me/progress");
      return progressEnvelopeSchema.parse(data).spaces;
    },
  };
}
