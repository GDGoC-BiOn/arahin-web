export type GenerationCheckpoint = {
  spaceId: string;
  generationId: string;
  fileName?: string;
};

/**
 * Survives a refresh so an in-flight job can be polled again. Phase 1 uses
 * sessionStorage; the backend job is the source of truth.
 */
export type GenerationCheckpointStore = {
  save(checkpoint: GenerationCheckpoint): void;
  load(): GenerationCheckpoint | null;
  clear(): void;
};
