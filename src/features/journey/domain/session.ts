export type LessonSummary = {
  id: string;
  orderIndex: number;
  title: string;
  quizCount: number;
  /** "completed" once the learner passed it; "unlocked" otherwise. */
  status?: string;
  completedAt?: string | null;
};

export type TrackSummary = {
  id: string;
  orderIndex: number;
  title: string;
  description?: string;
  lessons: LessonSummary[];
};

export type SessionStatus = "done" | "current" | "locked";

export type TimelineSession = {
  id: string;
  /** 1-based position shown as "Sesi N". */
  position: number;
  title: string;
  status: SessionStatus;
  /** Alternating sides, as in the design. */
  side: "left" | "right";
};

export type TimelineTrack = {
  id: string;
  title: string;
  subtitle: string;
  sessions: TimelineSession[];
  completedCount: number;
  totalCount: number;
  /** 0..1 for the header bar. */
  progress: number;
  /** The space's mastery, 0-100, once any graded activity was submitted. */
  mastery?: number | null;
};
