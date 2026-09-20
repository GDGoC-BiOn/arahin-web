import {
  type BlueprintValidationResult,
  type ChunkExtractionResult,
  type ChunkExtractionTask,
  contentHash,
  type LearningBlueprintDraft,
  type LocalChunkExtraction,
  type LocalConceptDraft,
  type MarkdownChunk,
  type ReconciliationInput,
  reconcileLocalConcepts,
  type TokenUsage,
  validateLearningBlueprintDraft,
} from "../domain/blueprint-extraction";

export type ChunkExtractor = (
  chunk: MarkdownChunk,
) => Promise<LocalChunkExtraction>;

export type MonolithicExtractor = (
  documentId: string,
  chunks: MarkdownChunk[],
) => Promise<LearningBlueprintDraft>;

export type ChunkExtractionStore = {
  get(taskKey: string): Promise<ChunkExtractionResult | null>;
  saveTask(task: ChunkExtractionTask): Promise<void>;
  saveResult(taskKey: string, result: ChunkExtractionResult): Promise<void>;
};

export type BlueprintReconciler = (
  input: ReconciliationInput,
) => Promise<LearningBlueprintDraft | BlueprintReconciliationResult>;

export type BlueprintReconciliationResult = {
  blueprint: LearningBlueprintDraft;
  usage?: TokenUsage;
};

export type BlueprintRepairer = (
  blueprint: LearningBlueprintDraft,
  validation: BlueprintValidationResult,
) => Promise<LearningBlueprintDraft>;

export type BlueprintExtractionOptions = {
  strategy?: "chunked" | "monolithic";
  concurrency?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
  extractorVersion?: string;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
};

export type BlueprintExtractionMetrics = {
  strategy: "chunked" | "monolithic";
  totalExtractionWallTimeMs: number;
  chunkCount: number;
  perChunkLatencyMs: number[];
  reconcileLatencyMs: number;
  conceptsProduced: number;
  duplicateConceptsMerged: number;
  validationFailures: number;
  repairAttempts: number;
  inputTokens: number;
  outputTokens: number;
  finalDagValid: boolean;
};

export type BlueprintExtractionOutput = {
  blueprint: LearningBlueprintDraft;
  metrics: BlueprintExtractionMetrics;
};

function addUsage(left: TokenUsage, right?: TokenUsage): TokenUsage {
  return {
    inputTokens: left.inputTokens + (right?.inputTokens ?? 0),
    outputTokens: left.outputTokens + (right?.outputTokens ?? 0),
  };
}

function taskKey(
  documentId: string,
  sourceChunkId: string,
  hash: string,
  version: string,
): string {
  return `${documentId}:${sourceChunkId}:${hash}:${version}`;
}

export function createBlueprintExtractionUseCases(dependencies: {
  extractChunk: ChunkExtractor;
  reconcile?: BlueprintReconciler;
  repair?: BlueprintRepairer;
  monolithicExtract?: MonolithicExtractor;
  store: ChunkExtractionStore;
}) {
  async function extractChunkWithRetry(
    chunk: MarkdownChunk,
    options: Required<BlueprintExtractionOptions>,
  ): Promise<{ result: LocalChunkExtraction; latencyMs: number }> {
    const hash = contentHash(chunk.markdown);
    const key = taskKey(
      chunk.documentId,
      chunk.sourceChunkId,
      hash,
      options.extractorVersion,
    );
    const persisted = await dependencies.store.get(key);
    if (persisted?.task.status === "succeeded" && persisted.result) {
      return { result: persisted.result, latencyMs: 0 };
    }

    const started = Date.now();
    let lastError: unknown;
    for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
      const now = options.now();
      const task: ChunkExtractionTask = {
        taskId: key,
        documentId: chunk.documentId,
        sourceChunkId: chunk.sourceChunkId,
        contentHash: hash,
        extractorVersion: options.extractorVersion,
        status: "running",
        attempt,
        createdAt: now,
        updatedAt: now,
      };
      await dependencies.store.saveTask(task);
      try {
        const result = await dependencies.extractChunk(chunk);
        const stored: ChunkExtractionResult = {
          task: { ...task, status: "succeeded", updatedAt: options.now() },
          result,
          usage: result.usage,
        };
        await dependencies.store.saveResult(key, stored);
        return { result, latencyMs: Date.now() - started };
      } catch (error) {
        lastError = error;
        const failed: ChunkExtractionResult = {
          task: {
            ...task,
            status: "failed",
            updatedAt: options.now(),
            errorMessage:
              error instanceof Error
                ? error.message
                : "Chunk extraction failed.",
          },
        };
        await dependencies.store.saveResult(key, failed);
        if (attempt < options.maxAttempts) {
          await options.sleep(options.retryDelayMs * attempt);
        }
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Chunk extraction failed.");
  }

  async function extractBlueprint(
    documentId: string,
    chunks: MarkdownChunk[],
    options: BlueprintExtractionOptions = {},
  ): Promise<BlueprintExtractionOutput> {
    const resolved: Required<BlueprintExtractionOptions> = {
      strategy: options.strategy ?? "chunked",
      concurrency: Math.max(1, Math.floor(options.concurrency ?? 4)),
      maxAttempts: Math.max(1, Math.floor(options.maxAttempts ?? 3)),
      retryDelayMs: Math.max(0, options.retryDelayMs ?? 100),
      extractorVersion: options.extractorVersion ?? "pr5b-v1",
      now: options.now ?? (() => new Date().toISOString()),
      sleep:
        options.sleep ??
        ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
    };
    const started = Date.now();

    if (resolved.strategy === "monolithic") {
      if (!dependencies.monolithicExtract) {
        throw new Error(
          "Monolithic extraction compatibility path is unavailable.",
        );
      }
      let blueprint = await dependencies.monolithicExtract(documentId, chunks);
      let validation = validateLearningBlueprintDraft(blueprint, chunks);
      const validationFailures = validation.issues.length;
      let repairAttempts = 0;
      if (!validation.valid && dependencies.repair) {
        repairAttempts = 1;
        blueprint = await dependencies.repair(blueprint, validation);
        validation = validateLearningBlueprintDraft(blueprint, chunks);
      }
      return {
        blueprint,
        metrics: {
          strategy: "monolithic",
          totalExtractionWallTimeMs: Date.now() - started,
          chunkCount: chunks.length,
          perChunkLatencyMs: [],
          reconcileLatencyMs: 0,
          conceptsProduced: blueprint.concepts.length,
          duplicateConceptsMerged: 0,
          validationFailures,
          repairAttempts,
          inputTokens: 0,
          outputTokens: 0,
          finalDagValid: validation.valid,
        },
      };
    }

    const results: Array<{ result: LocalChunkExtraction; latencyMs: number }> =
      new Array(chunks.length);
    let nextIndex = 0;
    async function worker(): Promise<void> {
      for (;;) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= chunks.length) return;
        const chunk = chunks[index];
        if (!chunk) return;
        results[index] = await extractChunkWithRetry(chunk, resolved);
      }
    }
    await Promise.all(
      Array.from(
        { length: Math.min(resolved.concurrency, chunks.length) },
        () => worker(),
      ),
    );

    const localConcepts: LocalConceptDraft[] = [];
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
    for (const item of results) {
      localConcepts.push(...item.result.concepts);
      usage = addUsage(usage, item.result.usage);
    }
    const reconciliationInput: ReconciliationInput = {
      documentId,
      chunks: chunks.map(
        ({
          sourceChunkId,
          chunkIndex,
          sectionStart,
          sectionEnd,
          previousChunkId,
          nextChunkId,
        }) => ({
          sourceChunkId,
          chunkIndex,
          sectionStart,
          sectionEnd,
          previousChunkId,
          nextChunkId,
        }),
      ),
      localConcepts,
    };
    const reconcileStarted = Date.now();
    const reconciled = await (dependencies.reconcile ?? reconcileLocalConcepts)(
      reconciliationInput,
    );
    let blueprint =
      "blueprint" in reconciled ? reconciled.blueprint : reconciled;
    const reconciliationUsage =
      "blueprint" in reconciled ? reconciled.usage : undefined;
    let validation = validateLearningBlueprintDraft(blueprint, chunks);
    const validationFailures = validation.issues.length;
    let repairAttempts = 0;
    if (!validation.valid && dependencies.repair) {
      repairAttempts = 1;
      blueprint = await dependencies.repair(blueprint, validation);
      validation = validateLearningBlueprintDraft(blueprint, chunks);
    }
    return {
      blueprint,
      metrics: {
        strategy: "chunked",
        totalExtractionWallTimeMs: Date.now() - started,
        chunkCount: chunks.length,
        perChunkLatencyMs: results.map(({ latencyMs }) => latencyMs),
        reconcileLatencyMs: Date.now() - reconcileStarted,
        conceptsProduced: blueprint.concepts.length,
        duplicateConceptsMerged: blueprint.metrics.duplicateConceptsMerged,
        validationFailures,
        repairAttempts,
        inputTokens:
          usage.inputTokens + (reconciliationUsage?.inputTokens ?? 0),
        outputTokens:
          usage.outputTokens + (reconciliationUsage?.outputTokens ?? 0),
        finalDagValid: validation.valid,
      },
    };
  }

  return { extractBlueprint };
}
