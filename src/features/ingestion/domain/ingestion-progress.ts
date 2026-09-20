import type { GenerationJob } from "./generation-job";

/**
 * Progress model for the "AI sedang memproses" screen.
 *
 * The constraint that shapes all of this: the backend emits no progress. The
 * upload's byte count is genuinely observable from the browser, but the parse
 * and the blueprint generation are single blocking calls that report nothing
 * until they return. So the percentage is built from real phase boundaries
 * plus real upload bytes, and inside an open-ended phase it eases toward that
 * phase's ceiling without ever reaching it. It cannot show 100% before the
 * work is actually finished, and it never moves backwards.
 */
export type IngestionPhase =
  | "idle"
  | "uploading"
  | "parsing"
  | "generating"
  | "done"
  | "failed";

export type StepStatus = "done" | "active" | "pending";

export type IngestionStep = {
  id: string;
  label: string;
  status: StepStatus;
};

/**
 * The five labels from the design. Steps 1-2 correspond to real events
 * (bytes sent, parse returned). Steps 3-5 all happen inside the one
 * /blueprint call, which is why they share a phase: the blueprint genuinely
 * does derive concepts, then order them into tracks, then write lesson bodies,
 * but the API surfaces no boundary between them.
 */
const STEP_DEFINITIONS = [
  { id: "read", label: "Membaca File", phase: "uploading" },
  { id: "extract", label: "Mengekstrak Informasi", phase: "parsing" },
  { id: "concepts", label: "Menemukan Konsep Utama", phase: "generating" },
  { id: "graph", label: "Menyusun Peta Pengetahuan", phase: "generating" },
  { id: "lessons", label: "Membuat Materi Belajar", phase: "generating" },
] as const;

export const INGESTION_STEP_COUNT = STEP_DEFINITIONS.length;

const PHASE_ORDER: IngestionPhase[] = [
  "idle",
  "uploading",
  "parsing",
  "generating",
  "done",
];

/** Where each phase starts and where it may not pass until it really ends. */
const PHASE_RANGE: Record<
  Exclude<IngestionPhase, "failed">,
  { from: number; to: number }
> = {
  idle: { from: 0, to: 0 },
  uploading: { from: 0, to: 20 },
  parsing: { from: 20, to: 45 },
  generating: { from: 45, to: 95 },
  done: { from: 100, to: 100 },
};

/** Time for an open-ended phase to cover ~63% of its range, in ms. */
const PHASE_TIME_CONSTANT: Record<string, number> = {
  uploading: 8_000,
  parsing: 12_000,
  generating: 45_000,
};

export type IngestionState = {
  phase: IngestionPhase;
  /** 0..1, from the browser's own upload progress. Only meaningful uploading. */
  uploadedFraction: number;
  /** How long the current phase has been running, in ms. */
  elapsedInPhaseMs: number;
};

export const INITIAL_INGESTION_STATE: IngestionState = {
  phase: "idle",
  uploadedFraction: 0,
  elapsedInPhaseMs: 0,
};

function phaseIndex(phase: IngestionPhase): number {
  const index = PHASE_ORDER.indexOf(phase);
  return index === -1 ? 0 : index;
}

/**
 * Eases across the phase's range, approaching but never reaching the ceiling.
 * An unknown-duration wait is honestly represented by motion that keeps
 * slowing down, not by a number that arrives somewhere it hasn't earned.
 */
function asymptotic(from: number, to: number, elapsedMs: number, tau: number) {
  const share = 1 - Math.exp(-elapsedMs / tau);
  return from + (to - from) * share;
}

export function ingestionPercent(
  state: IngestionState,
  generation?: Pick<GenerationJob, "stage" | "progress">,
): number {
  if (state.phase === "failed") return 0;
  if (state.phase === "done") return 100;
  if (state.phase === "idle") return 0;

  if (
    state.phase === "generating" &&
    generation?.stage === "generating_lessons" &&
    generation.progress.total > 0
  ) {
    const completed = Math.min(
      Math.max(generation.progress.completed, 0),
      generation.progress.total,
    );
    const share = completed / generation.progress.total;
    // Extraction/reconciliation has already finished by this stage.
    // The remaining quarter of the bar is real per-lesson durable progress.
    return Math.min(70 + Math.floor(share * 25), 94);
  }

  const range = PHASE_RANGE[state.phase];
  if (state.phase === "uploading") {
    // Real data: the fraction of bytes actually on the wire.
    const clamped = Math.min(Math.max(state.uploadedFraction, 0), 1);
    const fromBytes = range.from + (range.to - range.from) * clamped;
    if (clamped >= 1) return range.to;
    // A small file is handed to the socket in one go, so the browser reports
    // a single progress event at the very end and there is nothing to show
    // until then. Ease as a floor so the bar still moves, and let the real
    // byte count override it the moment it says something higher.
    const eased = asymptotic(
      range.from,
      range.to,
      state.elapsedInPhaseMs,
      PHASE_TIME_CONSTANT.uploading ?? 8_000,
    );
    return Math.min(Math.floor(Math.max(fromBytes, eased)), range.to - 1);
  }
  const tau = PHASE_TIME_CONSTANT[state.phase] ?? 20_000;
  const eased = asymptotic(range.from, range.to, state.elapsedInPhaseMs, tau);
  // Floor, and hold a point short of the ceiling: rounding would otherwise let
  // a long wait display the boundary value, which reads as "this phase is
  // finished" when the server has said no such thing.
  return Math.min(Math.floor(eased), range.to - 1);
}

export function ingestionSteps(state: IngestionState): IngestionStep[] {
  const current = phaseIndex(state.phase);

  return STEP_DEFINITIONS.map((definition) => {
    if (state.phase === "done") {
      return { id: definition.id, label: definition.label, status: "done" };
    }
    if (state.phase === "failed" || state.phase === "idle") {
      return { id: definition.id, label: definition.label, status: "pending" };
    }

    const stepPhase = phaseIndex(definition.phase);
    if (stepPhase < current) {
      return { id: definition.id, label: definition.label, status: "done" };
    }
    if (stepPhase > current) {
      return { id: definition.id, label: definition.label, status: "pending" };
    }

    // Inside the phase this step belongs to. Where a phase covers several
    // steps, the earlier ones settle as the phase wears on, but the last one
    // stays active until the phase genuinely completes.
    const siblings = STEP_DEFINITIONS.filter(
      (other) => other.phase === definition.phase,
    );
    if (siblings.length === 1) {
      return { id: definition.id, label: definition.label, status: "active" };
    }
    const position = siblings.findIndex((other) => other.id === definition.id);
    const tau = PHASE_TIME_CONSTANT[state.phase] ?? 20_000;
    // Never let the marker reach the final sibling on elapsed time alone:
    // that one only settles when the phase genuinely ends.
    const reached = asymptotic(
      0,
      siblings.length - 1,
      state.elapsedInPhaseMs,
      tau,
    );
    if (position < Math.floor(reached)) {
      return { id: definition.id, label: definition.label, status: "done" };
    }
    if (position === Math.min(Math.floor(reached), siblings.length - 1)) {
      return { id: definition.id, label: definition.label, status: "active" };
    }
    return { id: definition.id, label: definition.label, status: "pending" };
  });
}

export const PHASE_CAPTIONS: Record<IngestionPhase, string> = {
  idle: "Menyiapkan…",
  uploading: "Mengunggah dokumen kamu…",
  parsing: "Membaca isi dokumen…",
  generating: "Membangun blueprint pembelajaran…",
  done: "Selesai.",
  failed: "Gagal memproses.",
};

export function captionForGenerationStage(
  stage: string | undefined,
  phase: IngestionPhase,
): string {
  if (phase !== "generating" || !stage) return PHASE_CAPTIONS[phase];
  const captions: Record<string, string> = {
    parsing: "Membaca isi dokumen…",
    chunking: "Memecah dokumen…",
    extracting_blueprint: "Membangun blueprint pembelajaran…",
    reconciling: "Menyatukan konsep antar bab…",
    validating: "Memvalidasi struktur…",
    generating_lessons: "Membuat materi belajar…",
    finalizing: "Menyimpan hasil…",
  };
  return captions[stage] ?? PHASE_CAPTIONS[phase];
}
