import { describe, expect, it, vi } from "vitest";
import {
  type ChunkExtractionStore,
  createBlueprintExtractionUseCases,
} from "@/features/ingestion/application/blueprint-extraction-use-cases";
import {
  type ChunkExtractionResult,
  type LearningBlueprintDraft,
  type LocalChunkExtraction,
  type MarkdownChunk,
  reconcileLocalConcepts,
  validateLearningBlueprintDraft,
  validateSourceEvidence,
} from "@/features/ingestion/domain/blueprint-extraction";

function chunk(index: number, markdown = `Concept ${index}`): MarkdownChunk {
  return {
    documentId: "doc-1",
    sourceChunkId: `chunk-${index}`,
    chunkIndex: index,
    sectionStart: index,
    sectionEnd: index,
    markdown,
  };
}

function localResult(source: MarkdownChunk): LocalChunkExtraction {
  return {
    documentId: source.documentId,
    sourceChunkId: source.sourceChunkId,
    chunkIndex: source.chunkIndex,
    sectionStart: source.sectionStart,
    sectionEnd: source.sectionEnd,
    concepts: [
      {
        localConceptId: `local-${source.chunkIndex}`,
        title: source.markdown,
        aliases: [],
        summary: source.markdown,
        prerequisiteLocalConceptIds: [],
        sourceChunkId: source.sourceChunkId,
        sectionStart: source.sectionStart,
        sectionEnd: source.sectionEnd,
        evidence: [
          {
            quote: source.markdown,
            startOffset: 0,
            endOffset: source.markdown.length,
            sectionIndex: source.sectionStart,
          },
        ],
      },
    ],
    usage: { inputTokens: 10, outputTokens: 5 },
  };
}

function storeHarness(): {
  store: ChunkExtractionStore;
  saved: Map<string, ChunkExtractionResult>;
} {
  const saved = new Map<string, ChunkExtractionResult>();
  return {
    saved,
    store: {
      get: async (key) => saved.get(key) ?? null,
      saveTask: async (task) => {
        saved.set(task.taskId, { task });
      },
      saveResult: async (key, result) => {
        saved.set(key, result);
      },
    },
  };
}

function blueprint(documentId: string): LearningBlueprintDraft {
  return {
    documentId,
    concepts: [
      {
        canonicalId: "acid-base",
        title: "Acid-base chemistry",
        aliases: ["Acid base"],
        summary: "How acids and bases behave.",
        moduleId: "chemistry",
        prerequisiteCanonicalIds: [],
        evidence: [
          {
            sourceChunkId: "chunk-0",
            quote: "Acid",
            startOffset: 0,
            endOffset: 4,
            sectionIndex: 0,
          },
        ],
      },
    ],
    modules: [
      { moduleId: "chemistry", title: "Chemistry", conceptIds: ["acid-base"] },
    ],
    metrics: { localConceptCount: 2, duplicateConceptsMerged: 1 },
  };
}

describe("chunk-level blueprint extraction", () => {
  it("bounds concurrency, persists results, and reuses successful chunks", async () => {
    const { store, saved } = storeHarness();
    const chunks = [chunk(0), chunk(1), chunk(2), chunk(3)];
    let active = 0;
    let maximum = 0;
    const extractChunk = vi.fn(async (source: MarkdownChunk) => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return localResult(source);
    });
    const useCases = createBlueprintExtractionUseCases({
      extractChunk,
      store,
      reconcile: async () => blueprint("doc-1"),
    });

    const first = await useCases.extractBlueprint("doc-1", chunks, {
      concurrency: 2,
    });
    const second = await useCases.extractBlueprint("doc-1", chunks, {
      concurrency: 2,
    });

    expect(maximum).toBe(2);
    expect(extractChunk).toHaveBeenCalledTimes(4);
    expect(saved.size).toBe(4);
    expect(second.metrics.perChunkLatencyMs).toEqual([0, 0, 0, 0]);
    expect(first.metrics.inputTokens).toBe(40);
  });

  it("retries a failed chunk independently and records its attempts", async () => {
    const { store, saved } = storeHarness();
    const source = chunk(0);
    const extractChunk = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce(localResult(source));
    const useCases = createBlueprintExtractionUseCases({
      extractChunk,
      store,
      reconcile: async () => blueprint("doc-1"),
    });

    await useCases.extractBlueprint("doc-1", [source], {
      retryDelayMs: 0,
      now: () => "2026-01-01T00:00:00.000Z",
    });

    const result = [...saved.values()][0];
    expect(extractChunk).toHaveBeenCalledTimes(2);
    expect(result?.task.status).toBe("succeeded");
    expect(result?.task.attempt).toBe(2);
  });

  it("reconciles compact local drafts instead of concatenating chunks", async () => {
    const { store } = storeHarness();
    const reconcile = vi.fn(async (input) => {
      expect(input.localConcepts).toHaveLength(2);
      expect(input).not.toHaveProperty("markdown");
      return blueprint("doc-1");
    });
    const useCases = createBlueprintExtractionUseCases({
      store,
      extractChunk: async (source) => localResult(source),
      reconcile,
    });

    const output = await useCases.extractBlueprint("doc-1", [
      chunk(0, "Acid"),
      chunk(1, "Acid"),
    ]);
    expect(reconcile).toHaveBeenCalledOnce();
    expect(output.metrics.duplicateConceptsMerged).toBe(1);
    expect(output.metrics.finalDagValid).toBe(true);
  });
});

describe("blueprint evidence validation", () => {
  it("requires exact quote offsets and section indexes", () => {
    const source = chunk(0, "Acid-base chemistry");
    expect(
      validateSourceEvidence(source, {
        quote: "Acid",
        startOffset: 0,
        endOffset: 4,
        sectionIndex: 0,
      }),
    ).toBe(true);
    expect(
      validateSourceEvidence(source, {
        quote: "base",
        startOffset: 5,
        endOffset: 9,
        sectionIndex: 2,
      }),
    ).toBe(false);
  });

  it("rejects unknown cross-chunk prerequisites and cycles", () => {
    const invalid = blueprint("doc-1");
    const concept = invalid.concepts[0];
    if (!concept) throw new Error("test fixture is incomplete");
    concept.prerequisiteCanonicalIds = ["missing"];
    const result = validateLearningBlueprintDraft(invalid, [chunk(0, "Acid")]);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "UNKNOWN_PREREQUISITE",
    );
  });

  it("merges aliases, groups modules, and remaps prerequisites across chunks", () => {
    const first = localResult(chunk(0, "Variables")).concepts[0];
    const second = localResult(chunk(1, "Equations")).concepts[0];
    const duplicate = localResult(chunk(1, "Unknowns")).concepts[0];
    if (!first || !second || !duplicate) {
      throw new Error("test fixture is incomplete");
    }
    const result = reconcileLocalConcepts({
      documentId: "doc-1",
      chunks: [chunk(0, "Variables"), chunk(1, "Equations")],
      localConcepts: [
        {
          ...first,
          title: "Variables",
          aliases: ["Unknowns"],
          moduleHint: "Foundations",
        },
        {
          ...second,
          localConceptId: "local-1",
          title: "Equations",
          aliases: [],
          moduleHint: "Algebra",
          prerequisiteLocalConceptIds: ["local-0"],
        },
        {
          ...duplicate,
          localConceptId: "local-2",
          title: "Unknowns",
          aliases: ["Variables"],
          moduleHint: "Foundations",
        },
      ],
    });
    expect(result.concepts.map((concept) => concept.canonicalId)).toEqual([
      "variables",
      "equations",
    ]);
    expect(result.concepts[1]?.prerequisiteCanonicalIds).toEqual(["variables"]);
    expect(result.modules).toHaveLength(2);
    expect(result.metrics.duplicateConceptsMerged).toBe(1);
  });
});
