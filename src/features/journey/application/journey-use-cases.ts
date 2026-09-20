import type { JourneyGateway } from "../domain/journey-gateway";
import { buildProgressiveTimeline } from "../domain/progressive-generation";
import type { TimelineTrack } from "../domain/session";
import { buildTimeline } from "../domain/timeline";

export function createJourneyUseCases(gateway: JourneyGateway) {
  return {
    async loadTimeline(spaceId: string): Promise<TimelineTrack[]> {
      const [tracks, mastery] = await Promise.all([
        gateway.loadTracks(spaceId),
        // Mastery decorates the header; the timeline must not fail without it.
        gateway.loadMastery(spaceId).catch(() => null),
      ]);
      return tracks
        .slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((track) => ({ ...buildTimeline(track), mastery }));
    },
    async loadGenerationTimeline(spaceId: string, generationId: string) {
      const job = await gateway.loadGeneration(spaceId, generationId);
      return {
        job,
        track: buildProgressiveTimeline(job),
      };
    },
  };
}

export type JourneyUseCases = ReturnType<typeof createJourneyUseCases>;
