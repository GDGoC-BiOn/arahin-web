import type {
  GenerationCheckpoint,
  GenerationCheckpointStore,
} from "../domain/generation-checkpoint-store";

const STORAGE_KEY = "arahin.generation.checkpoint";

export function createLocalGenerationCheckpointStore(): GenerationCheckpointStore {
  return {
    save(checkpoint) {
      try {
        globalThis.sessionStorage?.setItem(
          STORAGE_KEY,
          JSON.stringify(checkpoint),
        );
      } catch {
        // A missing store must not stop generation; polling still works
        // for the current tab session.
      }
    },
    load() {
      try {
        const raw = globalThis.sessionStorage?.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          typeof (parsed as GenerationCheckpoint).spaceId !== "string" ||
          typeof (parsed as GenerationCheckpoint).generationId !== "string"
        ) {
          return null;
        }
        return parsed as GenerationCheckpoint;
      } catch {
        return null;
      }
    },
    clear() {
      try {
        globalThis.sessionStorage?.removeItem(STORAGE_KEY);
      } catch {
        // Same as save: convenience only.
      }
    },
  };
}
