import type {
  ProfileSnapshot,
  StatTile,
  StreakDay,
  StreakHistoryDay,
} from "./profile-summary";

/**
 * Every number on the Profile screen comes from here. The four tiles are the
 * design's "Documents / Day Streak / XP Earned / Quizzes", all read from
 * `/v1/me/progress` except documents, which sums sources across spaces.
 */
export function buildStats(snapshot: ProfileSnapshot): StatTile[] {
  const documents = snapshot.spaces.reduce(
    (total, space) => total + (space.sourceCount ?? 0),
    0,
  );
  return [
    { id: "documents", value: documents, label: "Dokumen" },
    { id: "streak", value: snapshot.dailyStreak, label: "Streak" },
    { id: "xp", value: snapshot.xpEarned, label: "XP" },
    { id: "quizzes", value: snapshot.quizzesTaken, label: "Kuis" },
  ];
}

export const STREAK_WINDOW = 7;

/** Indonesian weekday initials, indexed the same way as Date#getDay(). */
const WEEKDAY_INITIALS = ["M", "S", "S", "R", "K", "J", "S"] as const;

/**
 * The backend stores a streak as one integer — there is no per-day history to
 * read. A streak is by definition an unbroken run ending today, so filling the
 * last N days is a derivation from real data rather than an invention. It is
 * clamped at both ends: 0 fills nothing, anything past the window fills it.
 */
export function buildStreakDays(
  dailyStreak: number,
  today: Date,
  history: StreakHistoryDay[] | null = null,
): StreakDay[] {
  // The backend's per-day history is the truth when present: a day counts
  // when a quiz was actually taken on it, which the single integer can't say.
  if (history && history.length > 0) {
    const window = history.slice(-STREAK_WINDOW);
    return window.map((day, index) => ({
      label:
        WEEKDAY_INITIALS[new Date(`${day.date}T00:00:00Z`).getUTCDay()] ?? "?",
      offset: index - (window.length - 1),
      active: day.active,
    }));
  }

  const safeStreak = Number.isFinite(dailyStreak)
    ? Math.max(0, Math.floor(dailyStreak))
    : 0;
  const filled = Math.min(safeStreak, STREAK_WINDOW);

  const days: StreakDay[] = [];
  for (let index = 0; index < STREAK_WINDOW; index++) {
    const offset = index - (STREAK_WINDOW - 1); // -6 .. 0, today last
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    days.push({
      label: WEEKDAY_INITIALS[date.getDay()] ?? "?",
      offset,
      // The most recent `filled` days are the streak: offsets -(filled-1)..0.
      active: offset > -filled,
    });
  }
  return days;
}

export function initialOf(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed ? (trimmed[0] ?? "?").toUpperCase() : "?";
}

/** "Mahasiswa · Universitas Brawijaya", or whichever half exists, or null. */
export function profileSubtitle(user: {
  role: string;
  institution: string;
}): string | null {
  const parts = [user.role.trim(), user.institution.trim()].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
