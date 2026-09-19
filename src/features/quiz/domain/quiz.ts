export type QuizOption = {
  /** Single lowercase letter: "a", "b", … as the backend mints them. */
  id: string;
  label: string;
};

export type QuizItem = {
  id: string;
  orderIndex: number;
  question: string;
  options: QuizOption[];
};

/**
 * Note what is absent: no correct option, no explanation. The backend
 * deliberately never selects those columns, so the client genuinely cannot
 * know the answer until it submits.
 */
export type QuizDetail = {
  id: string;
  lessonId: string;
  title: string;
  passingScore: number;
  itemCount: number;
  items: QuizItem[];
};

export type QuizAnswer = {
  itemId: string;
  optionId: string;
};

/** The source page a question was drawn from, when the blueprint knew it. */
export type Citation = {
  source?: string;
  pdfPage?: number;
  slidePage?: number;
};

/**
 * One graded answer. Only ever arrives in the submit response — the key is
 * still never sent before the learner commits.
 */
export type AnswerFeedback = {
  itemId: string;
  chosenOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
  citation?: Citation;
};

/** Exactly what `POST /v1/quiz-attempts` returns. */
export type AttemptResult = {
  attemptId: string;
  quizId: string;
  score: number;
  correctCount: number;
  totalItems: number;
  isPassed: boolean;
  passingScore: number;
  dailyStreak: number;
  lessonCompleted: boolean;
  xpEarned?: number;
  answers?: AnswerFeedback[];
  /** Activity submissions only: the space's running mastery, 0-100. */
  mastery?: number;
  /** Activity submissions only: when this quiz comes up for review. */
  reviewDueAt?: string;
  reviewIntervalDays?: number;
};

/**
 * Where a quiz is graded. An Activity is the current model: submitting it also
 * updates mastery and schedules a spaced review. The legacy micro-quiz stays
 * as a fallback for lessons generated before activities existed.
 */
export type QuizSource =
  | { kind: "activity"; lessonId: string; activityId: string }
  | { kind: "quiz"; quizId: string };
