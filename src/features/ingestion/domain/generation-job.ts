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

export type GenerationLessonTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "retryable_failed"
  | "terminal_failed"
  | "aborted";

export type GenerationLessonTask = {
  conceptId: string;
  orderIndex: number;
  status: GenerationLessonTaskStatus;
  title?: string;
  contentMarkdown?: string;
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
  lessons?: GenerationLessonTask[];
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

/** Show counts only after fan-out fixes the total; 0/1 during extraction is not a lesson estimate. */
export function lessonProgressLabel(job: GenerationJob | null): string | null {
  if (
    !job ||
    (job.stage !== "generating_lessons" && job.stage !== "finalizing")
  )
    return null;
  if (job.progress.total < 1) return null;
  return `${job.progress.completed}/${job.progress.total} materi selesai`;
}
