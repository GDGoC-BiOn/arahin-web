import type { GenerationCheckpointStore } from "../domain/generation-checkpoint-store";
import {
  GENERATION_POLL_MS,
  type GenerationJob,
  isGenerationTerminal,
} from "../domain/generation-job";
import type {
  IngestionGateway,
  UploadProgressListener,
} from "../domain/ingestion-gateway";
import type { IngestionPhase } from "../domain/ingestion-progress";
import type {
  DueReview,
  GeneratedBlueprint,
  SpaceProgress,
  SpaceSummary,
} from "../domain/learning-space";
import {
  deriveSourceType,
  deriveSpaceTitle,
  rejectUpload,
  type UploadRejection,
} from "../domain/upload-candidate";

export class UploadRejectedError extends Error {
  constructor(public readonly rejection: UploadRejection) {
    super(rejection.message);
    this.name = "UploadRejectedError";
  }
}

export class GenerationFailedError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GenerationFailedError";
  }
}

export type IngestionResult = {
  spaceId: string;
  blueprint: GeneratedBlueprint;
  fileName?: string;
};

export type IngestionObserver = {
  onPhase(phase: IngestionPhase): void;
  onUploadProgress: UploadProgressListener;
  onGeneration?(job: GenerationJob): void;
  onResume?(fileName?: string): void;
};

export type GenerationClock = {
  wait(ms: number): Promise<void>;
};

const defaultClock: GenerationClock = {
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const EMPTY_BLUEPRINT: GeneratedBlueprint = {
  conceptCount: 0,
  trackCount: 0,
  lessonCount: 0,
  quizCount: 0,
  quizItemCount: 0,
  sourceCount: 0,
  isStub: false,
};

export function createIngestionUseCases(
  gateway: IngestionGateway,
  options: {
    clock?: GenerationClock;
    checkpoint?: GenerationCheckpointStore;
  } = {},
) {
  const clock = options.clock ?? defaultClock;
  const checkpoint = options.checkpoint;

  async function waitForGeneration(
    spaceId: string,
    generationId: string,
    observer: IngestionObserver,
  ): Promise<IngestionResult> {
    for (;;) {
      const job = await gateway.getBlueprintGeneration(spaceId, generationId);
      observer.onGeneration?.(job);
      if (job.status === "completed") {
        checkpoint?.clear();
        return {
          spaceId,
          blueprint: job.result ?? EMPTY_BLUEPRINT,
        };
      }
      if (job.status === "failed" || job.status === "cancelled") {
        checkpoint?.clear();
        throw new GenerationFailedError(
          job.errorCode ?? "BLUEPRINT_FAILED",
          job.errorMessage ?? "Blueprint generation failed.",
        );
      }
      if (!isGenerationTerminal(job.status)) {
        await clock.wait(GENERATION_POLL_MS);
      }
    }
  }

  return {
    /**
     * The design shows one drop; the backend needs create + upload + an
     * async generation job. The screen only has to render phases; this
     * function reports each real boundary as it is crossed.
     */
    async ingestDocument(
      file: File,
      observer: IngestionObserver,
    ): Promise<IngestionResult> {
      const rejection = rejectUpload({
        name: file.name,
        size: file.size,
        type: file.type,
      });
      if (rejection) throw new UploadRejectedError(rejection);

      observer.onPhase("uploading");
      const space = await gateway.createSpace({
        title: deriveSpaceTitle(file.name),
        description: "",
        sourceType: deriveSourceType(file.type),
      });

      // The backend parses inside this same request, so the boundary between
      // "uploading" and "parsing" is the moment the last byte goes out, not
      // the moment the response comes back. That is observable, so use it.
      let parsingAnnounced = false;
      await gateway.uploadSource({
        spaceId: space.id,
        file,
        onUploadProgress: (fraction) => {
          observer.onUploadProgress(fraction);
          if (fraction >= 1 && !parsingAnnounced) {
            parsingAnnounced = true;
            observer.onPhase("parsing");
          }
        },
      });
      observer.onPhase("generating");
      const started = await gateway.startBlueprintGeneration(space.id);
      observer.onGeneration?.(started);
      checkpoint?.save({
        spaceId: space.id,
        generationId: started.generationId,
        fileName: file.name,
      });
      const result = await waitForGeneration(
        space.id,
        started.generationId,
        observer,
      );
      observer.onPhase("done");
      return { ...result, fileName: file.name };
    },

    async resumeGeneration(
      observer: IngestionObserver,
    ): Promise<IngestionResult | null> {
      const saved = checkpoint?.load();
      if (!saved) return null;
      observer.onResume?.(saved.fileName);
      observer.onPhase("generating");
      const result = await waitForGeneration(
        saved.spaceId,
        saved.generationId,
        observer,
      );
      observer.onPhase("done");
      return { ...result, fileName: saved.fileName };
    },

    listSpaces(query?: string): Promise<SpaceSummary[]> {
      const trimmed = query?.trim();
      return gateway.listSpaces(trimmed ? trimmed : undefined);
    },
    listDueReviews(): Promise<DueReview[]> {
      return gateway.listDueReviews();
    },
    listProgress(): Promise<SpaceProgress[]> {
      return gateway.listProgress();
    },
  };
}

export type IngestionUseCases = ReturnType<typeof createIngestionUseCases>;
