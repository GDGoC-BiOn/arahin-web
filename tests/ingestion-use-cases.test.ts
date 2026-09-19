import { describe, expect, it, vi } from "vitest";
import {
  createIngestionUseCases,
  GenerationFailedError,
  type IngestionObserver,
  UploadRejectedError,
} from "@/features/ingestion/application/ingestion-use-cases";
import type { GenerationCheckpointStore } from "@/features/ingestion/domain/generation-checkpoint-store";
import type { GenerationJob } from "@/features/ingestion/domain/generation-job";
import type { IngestionGateway } from "@/features/ingestion/domain/ingestion-gateway";
import type { IngestionPhase } from "@/features/ingestion/domain/ingestion-progress";

const BLUEPRINT = {
  conceptCount: 8,
  trackCount: 3,
  lessonCount: 12,
  quizCount: 12,
  quizItemCount: 48,
  sourceCount: 1,
  isStub: false,
};

const COMPLETED_JOB: GenerationJob = {
  generationId: "gen-1",
  spaceId: "space-1",
  status: "completed",
  stage: "finalizing",
  progress: { completed: 1, total: 1 },
  result: BLUEPRINT,
};

function fakeFile(
  over: Partial<{ name: string; size: number; type: string }> = {},
) {
  const {
    name = "Organic Chemistry Ch.4.pdf",
    size = 2048,
    type = "application/pdf",
  } = over;
  return { name, size, type } as File;
}

function queuedJob(): GenerationJob {
  return {
    generationId: "gen-1",
    spaceId: "space-1",
    status: "queued",
    stage: "extracting_blueprint",
    progress: { completed: 0, total: 1 },
  };
}

function harness(
  overrides: Partial<IngestionGateway> = {},
  extras: {
    checkpoint?: GenerationCheckpointStore;
    waits?: number[];
  } = {},
) {
  const phases: IngestionPhase[] = [];
  const fractions: number[] = [];
  const jobs: GenerationJob[] = [];
  const waits: number[] = extras.waits ?? [];
  const gateway: IngestionGateway = {
    createSpace: vi.fn().mockResolvedValue({
      id: "space-1",
      title: "t",
      description: "",
      createdAt: "2026-09-13T00:00:00Z",
    }),
    uploadSource: vi.fn().mockImplementation(async ({ onUploadProgress }) => {
      onUploadProgress?.(0.5);
      onUploadProgress?.(1);
      return {
        id: "src-1",
        originalFileName: "bab1.pdf",
        fileType: "pdf",
        markdownChars: 100,
        imageCount: 0,
        duplicate: false,
        pages: 4,
      };
    }),
    startBlueprintGeneration: vi.fn().mockResolvedValue(queuedJob()),
    getBlueprintGeneration: vi.fn().mockResolvedValue(COMPLETED_JOB),
    listSpaces: vi.fn().mockResolvedValue([]),
    listProgress: vi.fn().mockResolvedValue([]),
    listDueReviews: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
  const observer: IngestionObserver = {
    onPhase: (p) => phases.push(p),
    onUploadProgress: (f) => fractions.push(f),
    onGeneration: (job) => jobs.push(job),
  };
  const useCases = createIngestionUseCases(gateway, {
    clock: { wait: async (ms) => waits.push(ms) },
    checkpoint: extras.checkpoint,
  });
  return { gateway, observer, phases, fractions, jobs, waits, useCases };
}

describe("ingestDocument", () => {
  it("runs create, upload, then an async generation job", async () => {
    const { gateway, observer, useCases } = harness();
    const result = await useCases.ingestDocument(fakeFile(), observer);

    expect(gateway.createSpace).toHaveBeenCalledWith({
      title: "Organic Chemistry Ch.4",
      description: "",
      sourceType: "pdf",
    });
    expect(gateway.uploadSource).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: "space-1" }),
    );
    expect(gateway.startBlueprintGeneration).toHaveBeenCalledWith("space-1");
    expect(gateway.getBlueprintGeneration).toHaveBeenCalledWith(
      "space-1",
      "gen-1",
    );
    expect(result).toEqual({
      spaceId: "space-1",
      blueprint: BLUEPRINT,
      fileName: "Organic Chemistry Ch.4.pdf",
    });
  });

  it("reports phases in order, with parsing starting at the last byte", async () => {
    const { observer, phases, useCases } = harness();
    await useCases.ingestDocument(fakeFile(), observer);
    expect(phases).toEqual(["uploading", "parsing", "generating", "done"]);
  });

  it("forwards the real upload fractions untouched", async () => {
    const { observer, fractions, useCases } = harness();
    await useCases.ingestDocument(fakeFile(), observer);
    expect(fractions).toEqual([0.5, 1]);
  });

  it("announces parsing only once even if progress reports 100% repeatedly", async () => {
    const { observer, phases, useCases } = harness({
      uploadSource: vi.fn().mockImplementation(async ({ onUploadProgress }) => {
        onUploadProgress?.(1);
        onUploadProgress?.(1);
        onUploadProgress?.(1);
        return {
          id: "s",
          originalFileName: "f",
          fileType: "pdf",
          markdownChars: 1,
          imageCount: 0,
          duplicate: false,
          pages: 1,
        };
      }),
    });
    await useCases.ingestDocument(fakeFile(), observer);
    expect(phases.filter((p) => p === "parsing")).toHaveLength(1);
  });

  it("rejects an unsupported file without touching the network", async () => {
    const { gateway, observer, phases, useCases } = harness();
    await expect(
      useCases.ingestDocument(
        fakeFile({
          name: "slides.pptx",
          type: "application/vnd.ms-powerpoint",
        }),
        observer,
      ),
    ).rejects.toBeInstanceOf(UploadRejectedError);

    expect(gateway.createSpace).not.toHaveBeenCalled();
    expect(gateway.uploadSource).not.toHaveBeenCalled();
    expect(phases).toEqual([]);
  });

  it("does not start generation when the upload fails", async () => {
    const { gateway, observer, useCases } = harness({
      uploadSource: vi.fn().mockRejectedValue(new Error("EMPTY_DOCUMENT")),
    });
    await expect(useCases.ingestDocument(fakeFile(), observer)).rejects.toThrow(
      "EMPTY_DOCUMENT",
    );
    expect(gateway.startBlueprintGeneration).not.toHaveBeenCalled();
  });

  it("polls until the job completes and waits between snapshots", async () => {
    const { observer, jobs, waits, useCases } = harness({
      getBlueprintGeneration: vi
        .fn()
        .mockResolvedValueOnce({
          ...queuedJob(),
          status: "running",
        })
        .mockResolvedValueOnce(COMPLETED_JOB),
    });
    await useCases.ingestDocument(fakeFile(), observer);
    expect(waits).toEqual([2500]);
    expect(jobs.map((job) => job.status)).toEqual([
      "queued",
      "running",
      "completed",
    ]);
  });

  it("never reports done when generation fails", async () => {
    const { observer, phases, useCases } = harness({
      getBlueprintGeneration: vi.fn().mockResolvedValue({
        ...queuedJob(),
        status: "failed",
        errorCode: "AI_UNAVAILABLE",
        errorMessage: "ai service returned 502",
      }),
    });
    await expect(
      useCases.ingestDocument(fakeFile(), observer),
    ).rejects.toBeInstanceOf(GenerationFailedError);
    expect(phases).not.toContain("done");
    expect(phases.at(-1)).toBe("generating");
  });

  it("persists a checkpoint so a refresh can resume polling", async () => {
    const saved: GenerationCheckpointStore = {
      save: vi.fn(),
      load: vi.fn().mockReturnValue({
        spaceId: "space-1",
        generationId: "gen-1",
        fileName: "notes.pdf",
      }),
      clear: vi.fn(),
    };
    const { observer, useCases, gateway } = harness({}, { checkpoint: saved });
    await useCases.ingestDocument(fakeFile(), observer);
    expect(saved.save).toHaveBeenCalledWith({
      spaceId: "space-1",
      generationId: "gen-1",
      fileName: "Organic Chemistry Ch.4.pdf",
    });
    expect(saved.clear).toHaveBeenCalled();

    const resumed = await useCases.resumeGeneration(observer);
    expect(gateway.getBlueprintGeneration).toHaveBeenCalledWith(
      "space-1",
      "gen-1",
    );
    expect(resumed?.fileName).toBe("notes.pdf");
  });

  it("resumeGeneration is a no-op without a checkpoint", async () => {
    const { observer, gateway, useCases } = harness();
    await expect(useCases.resumeGeneration(observer)).resolves.toBeNull();
    expect(gateway.getBlueprintGeneration).not.toHaveBeenCalled();
  });
});
