import type { GeneratedBlueprint } from "./learning-space";

export type GenerationStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type GenerationStage =
  | "parsing"
  | "chunking"
  | "extracting_blueprint"
  | "reconciling"
  | "validating"
  | "generating_lessons"
  | "finalizing";

export type GenerationProgress = {
  completed: number;
  total: number;
};

export type GenerationJob = {
  generationId: string;
  spaceId: string;
  status: GenerationStatus;
  stage: GenerationStage;
  progress: GenerationProgress;
  errorCode?: string;
  errorMessage?: string;
  result?: GeneratedBlueprint;
};

export const GENERATION_POLL_MS = 2_500;

export function isGenerationTerminal(status: GenerationStatus): boolean {
  return (
    status === "completed" || status === "failed" || status === "cancelled"
  );
}

export const GENERATION_STAGE_CAPTIONS: Record<GenerationStage, string> = {
  parsing: "Membaca isi dokumen…",
  chunking: "Memecah dokumen…",
  extracting_blueprint: "Membangun blueprint pembelajaran…",
  reconciling: "Menyatukan konsep antar bab…",
  validating: "Memvalidasi struktur…",
  generating_lessons: "Membuat materi belajar…",
  finalizing: "Menyimpan hasil…",
};
