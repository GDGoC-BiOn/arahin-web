export type ProfileUser = {
  id: string;
  email: string;
  fullName: string;
  /** Free text such as "Mahasiswa"; empty when never set. */
  role: string;
  institution: string;
};

export type ProfileUpdate = {
  fullName: string;
  role: string;
  institution: string;
};

/** Raw shapes as the backend returns them, before any derivation. */
export type ProfileSpace = {
  id: string;
  sourceCount: number;
};

export type ProfileProgressSpace = {
  id: string;
  totalLessons: number;
  completedLessons: number;
};

/** One day of `GET /v1/me/streak`: a UTC date and whether a quiz was taken. */
export type StreakHistoryDay = { date: string; active: boolean };

export type ProfileSnapshot = {
  user: ProfileUser;
  dailyStreak: number;
  xpEarned: number;
  quizzesTaken: number;
  /** Earliest first; null when the history could not be loaded. */
  streakHistory: StreakHistoryDay[] | null;
  /** null when the plan could not be loaded. */
  premium: boolean | null;
  /** null when notifications could not be loaded. */
  unreadNotifications: number | null;
  spaces: ProfileSpace[];
  progress: ProfileProgressSpace[];
};

export type StatTileId = "documents" | "streak" | "xp" | "quizzes";

export type StatTile = {
  id: StatTileId;
  value: number;
  label: string;
};

export type StreakDay = {
  /** Single-letter Indonesian weekday initial. */
  label: string;
  /** Day offset from today: -6 .. 0. Stable key, unlike the letter. */
  offset: number;
  active: boolean;
};

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationList = {
  notifications: AppNotification[];
  unreadCount: number;
};
