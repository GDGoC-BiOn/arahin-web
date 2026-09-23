export type WorkshopSpace = {
  id: string;
  title: string;
  hasTracks: boolean;
};

export type WorkshopLesson = {
  id: string;
  orderIndex: number;
  title: string;
  status?: string;
  completedAt?: string | null;
};

export type WorkshopTrack = {
  id: string;
  orderIndex: number;
  title: string;
  lessons: WorkshopLesson[];
};

export type WorkshopQuizOption = {
  id: string;
  label: string;
};

export type WorkshopQuizItem = {
  id: string;
  orderIndex: number;
  question: string;
  options: WorkshopQuizOption[];
};

export type WorkshopQuizDetail = {
  id: string;
  lessonId: string;
  title: string;
  passingScore: number;
  itemCount: number;
  items: WorkshopQuizItem[];
};

export type WorkshopQuizSource =
  | { kind: "activity"; lessonId: string; activityId: string }
  | { kind: "quiz"; quizId: string };

export type WorkshopQuizAnswer = {
  itemId: string;
  optionId: string;
};

export type WorkshopAnswerFeedback = {
  itemId: string;
  chosenOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
};

export type WorkshopAttemptResult = {
  score: number;
  correctCount: number;
  totalItems: number;
  isPassed: boolean;
  answers?: WorkshopAnswerFeedback[];
};

export type WorkshopQuiz = {
  source: WorkshopQuizSource;
  quiz: WorkshopQuizDetail;
};

export type WorkshopApi = {
  listSpaces(): Promise<WorkshopSpace[]>;
  loadTracks(spaceId: string): Promise<WorkshopTrack[]>;
  loadQuiz(spaceId: string, lessonId: string): Promise<WorkshopQuiz>;
  submitQuiz(input: {
    source: WorkshopQuizSource;
    answers: WorkshopQuizAnswer[];
  }): Promise<WorkshopAttemptResult>;
};
