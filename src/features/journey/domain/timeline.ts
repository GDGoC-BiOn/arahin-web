import type {
  LessonSummary,
  SessionStatus,
  TimelineTrack,
  TrackSummary,
} from "./session";

/**
 * Turns a track's lessons into the design's alternating timeline.
 *
 * Completion comes from the backend: each lesson in `GET /v1/spaces/{id}/tracks`
 * carries the learner's own `status`, so the timeline is the same on every
 * device.
 *
 * Exactly one session is "current": the first not-yet-completed one. Everything
 * after it is locked, which is what makes the rail's filled length meaningful.
 */
export function buildTimeline(track: TrackSummary): TimelineTrack {
  const ordered = [...track.lessons].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  // TODO 1 (workshop): derive the real production state.
  //
  // Rules:
  // - completed lesson -> "done"
  // - first incomplete lesson -> "current"
  // - every lesson after it -> "locked"
  //
  // The UI below this domain function is already the real production Journey UI.
  const sessions = ordered.map((lesson, index) => {
    // Deliberately incomplete starter behavior: completion is respected, but
    // every unfinished lesson is treated as current. Participants fix this so
    // only the first unfinished lesson is current and the rest are locked.
    const status: SessionStatus = isCompleted(lesson) ? "done" : "current";
    return {
      id: lesson.id,
      position: index + 1,
      title: lesson.title,
      status,
      // The design starts on the right and alternates.
      side: (index % 2 === 0 ? "right" : "left") as "left" | "right",
    };
  });

  const completedCount = sessions.filter((s) => s.status === "done").length;
  const totalCount = sessions.length;

  return {
    id: track.id,
    title: track.title,
    // The generated description when there is one; otherwise state what the
    // track contains rather than inventing a blurb.
    subtitle: track.description?.trim() || subtitleFor(ordered.length),
    sessions,
    completedCount,
    totalCount,
    progress: totalCount === 0 ? 0 : completedCount / totalCount,
  };
}

export function isCompleted(lesson: LessonSummary): boolean {
  return lesson.status === "completed" || Boolean(lesson.completedAt);
}

function subtitleFor(lessonCount: number): string {
  if (lessonCount === 0) return "Belum ada sesi";
  return `${lessonCount} sesi belajar`;
}

/**
 * How far down the rail the filled segment reaches. The rail connects node
 * centres, so with N nodes the filled part spans the gaps already crossed:
 * completing the first of five sessions fills one quarter, not one fifth.
 */
export function railProgress(track: TimelineTrack): number {
  const gaps = track.totalCount - 1;
  if (gaps <= 0) return track.completedCount > 0 ? 1 : 0;
  return Math.min(track.completedCount / gaps, 1);
}
