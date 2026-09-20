import type { TimelineTrack } from "./session";

export type ProgressiveGenerationLesson = {
  conceptId: string;
  orderIndex: number;
  status:
    | "pending"
    | "running"
    | "completed"
    | "retryable_failed"
    | "terminal_failed"
    | "aborted";
  title?: string;
  contentMarkdown?: string;
};

export type ProgressiveGenerationJob = {
  generationId: string;
  spaceId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  stage: string;
  progress: {
    completed: number;
    total: number;
  };
  errorCode?: string;
  errorMessage?: string;
  lessons?: ProgressiveGenerationLesson[];
};

export function buildProgressiveTimeline(
  job: ProgressiveGenerationJob,
): TimelineTrack {
  const ordered = [...(job.lessons ?? [])].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const firstOrderIndex = ordered[0]?.orderIndex;

  return {
    id: `generation-${job.generationId}`,
    title: "Materi sedang disiapkan",
    subtitle:
      job.progress.total > 0
        ? `${job.progress.completed}/${job.progress.total} materi siap · kamu bisa mulai dari Sesi 1`
        : "Menyiapkan materi belajar…",
    sessions: ordered.map((lesson, index) => {
      const firstReady =
        lesson.orderIndex === firstOrderIndex &&
        lesson.status === "completed" &&
        Boolean(lesson.contentMarkdown);

      return {
        id: lesson.conceptId,
        position: index + 1,
        title:
          lesson.title ??
          (lesson.status === "running" || lesson.status === "retryable_failed"
            ? "Sedang dibuat…"
            : "Menunggu giliran…"),
        status: firstReady ? ("current" as const) : ("locked" as const),
        side: (index % 2 === 0 ? "right" : "left") as "left" | "right",
        previewMarkdown: firstReady ? lesson.contentMarkdown : undefined,
      };
    }),
    completedCount: 0,
    totalCount: ordered.length,
    progress: 0,
    generationProgress: job.progress,
  };
}
