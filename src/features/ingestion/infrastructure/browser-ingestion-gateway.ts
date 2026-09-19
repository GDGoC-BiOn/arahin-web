import type { AxiosInstance } from "axios";
import type { GenerationJob } from "../domain/generation-job";
import type { IngestionGateway } from "../domain/ingestion-gateway";
import type {
  CreatedSpace,
  DueReview,
  SpaceProgress,
  SpaceSummary,
  UploadedSource,
} from "../domain/learning-space";

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
      const { data } = await client.post<CreatedSpace>("/spaces", input);
      return data;
    },

    async uploadSource({ spaceId, file, onUploadProgress }) {
      const form = new FormData();
      // Field name fixed by the backend: it reads exactly "file".
      form.append("file", file);
      const { data } = await client.post<UploadedSource>(
        `/spaces/${spaceId}/sources`,
        form,
        {
          timeout: UPLOAD_TIMEOUT_MS,
          onUploadProgress: (event) => {
            if (!onUploadProgress) return;
            // `total` is absent on some transports; without it there is no
            // honest fraction to report, so report nothing rather than guess.
            if (typeof event.total !== "number" || event.total <= 0) return;
            onUploadProgress(Math.min(event.loaded / event.total, 1));
          },
        },
      );
      return data;
    },

    async startBlueprintGeneration(spaceId): Promise<GenerationJob> {
      const { data } = await client.post<GenerationJob>(
        `/spaces/${spaceId}/blueprint/generations`,
      );
      return data;
    },

    async getBlueprintGeneration(
      spaceId,
      generationId,
    ): Promise<GenerationJob> {
      const { data } = await client.get<GenerationJob>(
        `/spaces/${spaceId}/blueprint/generations/${generationId}`,
      );
      return data;
    },

    async listDueReviews(): Promise<DueReview[]> {
      const { data } = await client.get<{ reviews?: DueReview[] }>(
        "/reviews/active",
      );
      return data.reviews ?? [];
    },

    async listSpaces(query?: string): Promise<SpaceSummary[]> {
      const { data } = await client.get<{ learningSpaces: SpaceSummary[] }>(
        "/spaces",
        { params: query ? { q: query } : undefined },
      );
      return data.learningSpaces;
    },

    async listProgress(): Promise<SpaceProgress[]> {
      const { data } = await client.get<{ spaces: SpaceProgress[] }>(
        "/me/progress",
      );
      return data.spaces;
    },
  };
}
