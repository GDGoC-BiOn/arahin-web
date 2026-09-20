export type MarkdownChunk = {
  documentId: string;
  sourceChunkId: string;
  chunkIndex: number;
  sectionStart: number;
  sectionEnd: number;
  markdown: string;
  previousChunkId?: string;
  nextChunkId?: string;
};

export type SourceEvidence = {
  quote: string;
  startOffset: number;
  endOffset: number;
  sectionIndex: number;
};

/** A local, provisional concept. It is never a LearningBlueprint. */
export type LocalConceptDraft = {
  localConceptId: string;
  title: string;
  aliases: string[];
  summary: string;
  moduleHint?: string;
  prerequisiteLocalConceptIds: string[];
  sourceChunkId: string;
  sectionStart: number;
  sectionEnd: number;
  evidence: SourceEvidence[];
};

export type LocalChunkExtraction = {
  documentId: string;
  sourceChunkId: string;
  chunkIndex: number;
  sectionStart: number;
  sectionEnd: number;
  concepts: LocalConceptDraft[];
  usage?: TokenUsage;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type ChunkExtractionTaskStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

export type ChunkExtractionTask = {
  taskId: string;
  documentId: string;
  sourceChunkId: string;
  contentHash: string;
  extractorVersion: string;
  status: ChunkExtractionTaskStatus;
  attempt: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
};

export type ChunkExtractionResult = {
  task: ChunkExtractionTask;
  result?: LocalChunkExtraction;
  usage?: TokenUsage;
};

export type ReconciliationInput = {
  documentId: string;
  chunks: Pick<
    MarkdownChunk,
    | "sourceChunkId"
    | "chunkIndex"
    | "sectionStart"
    | "sectionEnd"
    | "previousChunkId"
    | "nextChunkId"
  >[];
  localConcepts: LocalConceptDraft[];
};

export type CanonicalConceptDraft = {
  canonicalId: string;
  title: string;
  aliases: string[];
  summary: string;
  moduleId: string;
  prerequisiteCanonicalIds: string[];
  evidence: Array<SourceEvidence & { sourceChunkId: string }>;
};

export type LearningModuleDraft = {
  moduleId: string;
  title: string;
  conceptIds: string[];
};

export type LearningBlueprintDraft = {
  documentId: string;
  concepts: CanonicalConceptDraft[];
  modules: LearningModuleDraft[];
  metrics: {
    localConceptCount: number;
    duplicateConceptsMerged: number;
  };
};

function conceptKey(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value: string): string {
  return conceptKey(value).replaceAll(" ", "-") || "concept";
}

/**
 * Deterministic fallback reconciler used by tests and compatibility callers.
 * A production model can replace it, but the merge and ID invariants remain
 * the same at the boundary.
 */
export function reconcileLocalConcepts(
  input: ReconciliationInput,
): LearningBlueprintDraft {
  const clusters: LocalConceptDraft[][] = [];
  const localToCluster = new Map<string, LocalConceptDraft[]>();
  for (const concept of input.localConcepts) {
    const keys = new Set([
      conceptKey(concept.title),
      ...concept.aliases.map(conceptKey),
    ]);
    const cluster = clusters.find((candidate) => {
      const candidateKeys = new Set(
        candidate.flatMap((item) => [
          conceptKey(item.title),
          ...item.aliases.map(conceptKey),
        ]),
      );
      return [...keys].some((key) => key && candidateKeys.has(key));
    });
    const target = cluster ?? [];
    if (!cluster) clusters.push(target);
    target.push(concept);
    localToCluster.set(concept.localConceptId, target);
  }

  const usedIds = new Set<string>();
  const clusterId = new Map<LocalConceptDraft[], string>();
  for (const cluster of clusters) {
    const base = slug(cluster[0]?.title ?? "concept");
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) id = `${base}-${suffix++}`;
    usedIds.add(id);
    clusterId.set(cluster, id);
  }

  const concepts: CanonicalConceptDraft[] = clusters.map((cluster) => {
    const first = cluster[0];
    if (!first) throw new Error("Cannot reconcile an empty concept cluster.");
    const summaries = cluster
      .map((item) => item.summary)
      .sort((left, right) => right.length - left.length);
    const moduleId = slug(
      first.moduleHint ?? `module-${Math.max(1, first.sectionStart)}`,
    );
    const aliases = [
      ...new Set(cluster.flatMap((item) => [item.title, ...item.aliases])),
    ].filter((alias) => alias !== first.title);
    const prerequisiteCanonicalIds = [
      ...new Set(
        cluster.flatMap((item) =>
          item.prerequisiteLocalConceptIds
            .map((localId) => localToCluster.get(localId))
            .filter((prerequisite): prerequisite is LocalConceptDraft[] =>
              Boolean(prerequisite),
            )
            .map((prerequisite) => clusterId.get(prerequisite))
            .filter(
              (prerequisite): prerequisite is string =>
                Boolean(prerequisite) &&
                prerequisite !== clusterId.get(cluster),
            ),
        ),
      ),
    ];
    return {
      canonicalId: clusterId.get(cluster) ?? "concept",
      title: first.title,
      aliases,
      summary: summaries[0] ?? first.summary,
      moduleId,
      prerequisiteCanonicalIds,
      evidence: cluster.flatMap((item) =>
        item.evidence.map((evidence) => ({
          ...evidence,
          sourceChunkId: item.sourceChunkId,
        })),
      ),
    };
  });

  const modules = [
    ...new Map(
      concepts.map((concept) => [
        concept.moduleId,
        {
          moduleId: concept.moduleId,
          title: concept.moduleId.replaceAll("-", " "),
          conceptIds: concepts
            .filter((candidate) => candidate.moduleId === concept.moduleId)
            .map((candidate) => candidate.canonicalId),
        },
      ]),
    ).values(),
  ];
  return {
    documentId: input.documentId,
    concepts,
    modules,
    metrics: {
      localConceptCount: input.localConcepts.length,
      duplicateConceptsMerged: input.localConcepts.length - concepts.length,
    },
  };
}

export type BlueprintValidationIssue = {
  code:
    | "EMPTY_CONCEPT_ID"
    | "DUPLICATE_CONCEPT_ID"
    | "UNKNOWN_PREREQUISITE"
    | "SELF_PREREQUISITE"
    | "PREREQUISITE_CYCLE"
    | "UNKNOWN_MODULE_CONCEPT"
    | "INVALID_SOURCE_EVIDENCE";
  message: string;
  conceptId?: string;
};

export type BlueprintValidationResult = {
  valid: boolean;
  issues: BlueprintValidationIssue[];
};

export function contentHash(markdown: string): string {
  let hash = 2166136261;
  for (let index = 0; index < markdown.length; index += 1) {
    hash ^= markdown.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function validateSourceEvidence(
  chunk: MarkdownChunk,
  evidence: SourceEvidence,
): boolean {
  return (
    evidence.startOffset >= 0 &&
    evidence.endOffset > evidence.startOffset &&
    evidence.endOffset <= chunk.markdown.length &&
    evidence.sectionIndex >= chunk.sectionStart &&
    evidence.sectionIndex <= chunk.sectionEnd &&
    chunk.markdown.slice(evidence.startOffset, evidence.endOffset) ===
      evidence.quote
  );
}

export function validateLearningBlueprintDraft(
  blueprint: LearningBlueprintDraft,
  chunks: MarkdownChunk[],
): BlueprintValidationResult {
  const issues: BlueprintValidationIssue[] = [];
  const ids = new Set<string>();
  const concepts = new Map<string, CanonicalConceptDraft>();
  const chunkById = new Map(
    chunks.map((chunk) => [chunk.sourceChunkId, chunk]),
  );

  for (const concept of blueprint.concepts) {
    if (!concept.canonicalId.trim()) {
      issues.push({
        code: "EMPTY_CONCEPT_ID",
        message: "Concept ID is empty.",
      });
    } else if (ids.has(concept.canonicalId)) {
      issues.push({
        code: "DUPLICATE_CONCEPT_ID",
        message: `Duplicate concept ID: ${concept.canonicalId}.`,
        conceptId: concept.canonicalId,
      });
    }
    ids.add(concept.canonicalId);
    concepts.set(concept.canonicalId, concept);
  }

  for (const concept of blueprint.concepts) {
    for (const prerequisiteId of concept.prerequisiteCanonicalIds) {
      if (!ids.has(prerequisiteId)) {
        issues.push({
          code: "UNKNOWN_PREREQUISITE",
          message: `Unknown prerequisite: ${prerequisiteId}.`,
          conceptId: concept.canonicalId,
        });
      }
      if (prerequisiteId === concept.canonicalId) {
        issues.push({
          code: "SELF_PREREQUISITE",
          message: `Concept ${concept.canonicalId} requires itself.`,
          conceptId: concept.canonicalId,
        });
      }
    }

    for (const evidence of concept.evidence) {
      const chunk = chunkById.get(evidence.sourceChunkId);
      if (!chunk || !validateSourceEvidence(chunk, evidence)) {
        issues.push({
          code: "INVALID_SOURCE_EVIDENCE",
          message: `Evidence for ${concept.canonicalId} does not match its source chunk.`,
          conceptId: concept.canonicalId,
        });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string): void {
    if (visiting.has(id)) {
      issues.push({
        code: "PREREQUISITE_CYCLE",
        message: `Prerequisite cycle includes ${id}.`,
        conceptId: id,
      });
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of concepts.get(id)?.prerequisiteCanonicalIds ??
      []) {
      if (concepts.has(prerequisite)) visit(prerequisite);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const concept of blueprint.concepts) visit(concept.canonicalId);

  for (const module of blueprint.modules) {
    for (const conceptId of module.conceptIds) {
      if (!concepts.has(conceptId)) {
        issues.push({
          code: "UNKNOWN_MODULE_CONCEPT",
          message: `Module ${module.moduleId} references ${conceptId}.`,
        });
      }
    }
  }
  return { valid: issues.length === 0, issues };
}
