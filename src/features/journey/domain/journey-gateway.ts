import type { TrackSummary } from "./session";

export type JourneyGateway = {
  loadTracks(spaceId: string): Promise<TrackSummary[]>;
  /** The space's mastery, 0-100, or null when no journey exists yet. */
  loadMastery(spaceId: string): Promise<number | null>;
};
