export type CreatedSpace = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

export type UploadedSource = {
  id: string;
  originalFileName: string;
  fileType: string;
  markdownChars: number;
  imageCount: number;
  /** True when the same bytes were already in this space (backend answers 200). */
  duplicate: boolean;
  pages: number;
};

export type GeneratedBlueprint = {
  conceptCount: number;
  trackCount: number;
  lessonCount: number;
  quizCount: number;
  quizItemCount: number;
  sourceCount: number;
  /** True when AI_BASE_URL is unset upstream: titles are prefixed "[STUB]". */
  isStub: boolean;
};

export type SpaceSummary = {
  id: string;
  title: string;
  description: string;
  sourceType: string;
  estimatedHours: number;
  difficultyLevel: string;
  sourceCount: number;
  hasTracks: boolean;
  createdAt: string;
};

export type SpaceProgress = {
  id: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
};

/** One entry of `GET /v1/reviews/active`: a quiz whose spaced review is due. */
export type DueReview = {
  reviewId: string;
  activityId: string;
  activityTitle: string;
  lessonId: string;
  lessonTitle: string;
  spaceId: string;
  spaceTitle: string;
  dueAt: string;
  intervalDays: number;
};
