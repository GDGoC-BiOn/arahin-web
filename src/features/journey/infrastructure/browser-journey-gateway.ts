import type { AxiosInstance } from "axios";
import type { JourneyGateway } from "../domain/journey-gateway";
import type { ProgressiveGenerationJob } from "../domain/progressive-generation";
import type { TrackSummary } from "../domain/session";

export function createBrowserJourneyGateway(
  client: AxiosInstance,
): JourneyGateway {
  return {
    async loadTracks(spaceId: string): Promise<TrackSummary[]> {
      const { data } = await client.get<{ tracks: TrackSummary[] }>(
        `/spaces/${spaceId}/tracks`,
      );
      return data.tracks ?? [];
    },
    async loadMastery(spaceId: string): Promise<number | null> {
      const { data } = await client.get<{ journeys?: { mastery?: number }[] }>(
        `/spaces/${spaceId}/journeys`,
      );
      const mastery = data.journeys?.[0]?.mastery;
      return typeof mastery === "number" ? mastery : null;
    },
    async loadGeneration(
      spaceId: string,
      generationId: string,
    ): Promise<ProgressiveGenerationJob> {
      const { data } = await client.get<ProgressiveGenerationJob>(
        `/spaces/${spaceId}/blueprint/generations/${generationId}`,
      );
      return data;
    },
  };
}
