import { describe, expect, it } from "vitest";
import {
  buildStats,
  buildStreakDays,
  initialOf,
  STREAK_WINDOW,
} from "@/features/profile/domain/profile-stats";
import type { ProfileSnapshot } from "@/features/profile/domain/profile-summary";

const snapshot = (over: Partial<ProfileSnapshot> = {}): ProfileSnapshot => ({
  user: {
    id: "u1",
    email: "a@b.co",
    fullName: "Ahmad Dimas",
    role: "",
    institution: "",
  },
  dailyStreak: 0,
  xpEarned: 0,
  quizzesTaken: 0,
  streakHistory: null,
  premium: null,
  unreadNotifications: null,
  spaces: [],
  progress: [],
  ...over,
});

// A fixed Wednesday, so weekday labels are deterministic.
const WEDNESDAY = new Date("2026-09-16T10:00:00Z");

describe("buildStats", () => {
  it("always returns the design's four tiles", () => {
    expect(buildStats(snapshot()).map((t) => t.id)).toEqual([
      "documents",
      "streak",
      "xp",
      "quizzes",
    ]);
  });

  it("sums sourceCount across spaces for the document count", () => {
    const stats = buildStats(
      snapshot({
        spaces: [
          { id: "a", sourceCount: 2 },
          { id: "b", sourceCount: 3 },
          { id: "c", sourceCount: 0 },
        ],
      }),
    );
    expect(stats[0]).toMatchObject({ id: "documents", value: 5 });
  });

  it("reads XP and quiz count from the progress summary", () => {
    const stats = buildStats(snapshot({ xpEarned: 25, quizzesTaken: 3 }));
    expect(stats[2]).toMatchObject({ id: "xp", value: 25 });
    expect(stats[3]).toMatchObject({ id: "quizzes", value: 3 });
  });

  it("passes the streak through untouched", () => {
    expect(buildStats(snapshot({ dailyStreak: 4 }))[1]).toMatchObject({
      id: "streak",
      value: 4,
    });
  });

  it("reports zeros, never NaN, for a brand new account", () => {
    const stats = buildStats(snapshot());
    expect(stats.map((t) => t.value)).toEqual([0, 0, 0, 0]);
    for (const tile of stats) expect(Number.isNaN(tile.value)).toBe(false);
  });
});

describe("buildStreakDays", () => {
  const actives = (streak: number) =>
    buildStreakDays(streak, WEDNESDAY).filter((d) => d.active).length;

  it("always renders a full week", () => {
    expect(buildStreakDays(3, WEDNESDAY)).toHaveLength(STREAK_WINDOW);
  });

  it("ends on today", () => {
    const days = buildStreakDays(1, WEDNESDAY);
    expect(days.at(-1)?.offset).toBe(0);
    expect(days[0]?.offset).toBe(-6);
  });

  it("lights exactly as many days as the streak", () => {
    // The off-by-one here is the whole point: a 1-day streak is one circle.
    for (let streak = 0; streak <= STREAK_WINDOW; streak++) {
      expect(actives(streak)).toBe(streak);
    }
  });

  it("lights the most recent days, ending today", () => {
    const days = buildStreakDays(3, WEDNESDAY);
    expect(days.map((d) => d.active)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  it("clamps a streak longer than the window", () => {
    expect(actives(30)).toBe(STREAK_WINDOW);
  });

  it("treats nonsense input as no streak", () => {
    expect(actives(-5)).toBe(0);
    expect(buildStreakDays(Number.NaN, WEDNESDAY).some((d) => d.active)).toBe(
      false,
    );
  });

  it("labels the days ending on the real weekday", () => {
    // 2026-09-16 is a Wednesday -> "R" in Indonesian.
    const days = buildStreakDays(7, WEDNESDAY);
    expect(days.at(-1)?.label).toBe("R");
    expect(days.map((d) => d.label)).toEqual([
      "K",
      "J",
      "S",
      "M",
      "S",
      "S",
      "R",
    ]);
  });
});

describe("initialOf", () => {
  it("takes the first letter, uppercased", () => {
    expect(initialOf("Ahmad Dimas")).toBe("A");
    expect(initialOf("  dimas ")).toBe("D");
  });

  it("never renders an empty avatar", () => {
    expect(initialOf("")).toBe("?");
    expect(initialOf("   ")).toBe("?");
  });
});

import { profileSubtitle } from "@/features/profile/domain/profile-stats";

describe("profileSubtitle", () => {
  it("joins whichever of role and institution exist", () => {
    expect(profileSubtitle({ role: "Mahasiswa", institution: "UB" })).toBe(
      "Mahasiswa · UB",
    );
    expect(profileSubtitle({ role: " ", institution: "UB" })).toBe("UB");
    expect(profileSubtitle({ role: "", institution: "" })).toBeNull();
  });
});

describe("buildStreakDays with server history", () => {
  const history = [
    { date: "2026-09-10", active: false },
    { date: "2026-09-11", active: true },
    { date: "2026-09-12", active: false },
    { date: "2026-09-13", active: true },
    { date: "2026-09-14", active: true },
    { date: "2026-09-15", active: false },
    { date: "2026-09-16", active: true },
  ];

  it("uses each day's real activity, gaps included", () => {
    const days = buildStreakDays(1, WEDNESDAY, history);
    expect(days.map((d) => d.active)).toEqual([
      false,
      true,
      false,
      true,
      true,
      false,
      true,
    ]);
  });

  it("labels days from their dates, today last", () => {
    const days = buildStreakDays(0, WEDNESDAY, history);
    // 2026-09-10 is a Thursday, 2026-09-16 a Wednesday.
    expect(days[0]?.label).toBe("K");
    expect(days.at(-1)?.label).toBe("R");
    expect(days.at(-1)?.offset).toBe(0);
  });

  it("falls back to the integer when history is missing or empty", () => {
    expect(
      buildStreakDays(2, WEDNESDAY, null).filter((d) => d.active),
    ).toHaveLength(2);
    expect(
      buildStreakDays(2, WEDNESDAY, []).filter((d) => d.active),
    ).toHaveLength(2);
  });
});

import {
  markReadLocally,
  notificationAge,
} from "@/features/profile/domain/notifications";

describe("notifications", () => {
  const list = {
    unreadCount: 2,
    notifications: [
      {
        id: "a",
        kind: "quiz_passed",
        title: "A",
        body: "",
        readAt: null,
        createdAt: "2026-09-17T10:00:00Z",
      },
      {
        id: "b",
        kind: "lesson_completed",
        title: "B",
        body: "",
        readAt: null,
        createdAt: "2026-09-17T09:00:00Z",
      },
      {
        id: "c",
        kind: "lesson_completed",
        title: "C",
        body: "",
        readAt: "2026-09-16T00:00:00Z",
        createdAt: "2026-09-16T00:00:00Z",
      },
    ],
  };

  it("marks one read and decrements the unread count", () => {
    const next = markReadLocally(list, "a", "2026-09-17T11:00:00Z");
    expect(next.unreadCount).toBe(1);
    expect(next.notifications[0]?.readAt).toBe("2026-09-17T11:00:00Z");
    expect(next.notifications[1]?.readAt).toBeNull();
  });

  it("is a no-op for an already-read or unknown notification", () => {
    expect(markReadLocally(list, "c", "x")).toBe(list);
    expect(markReadLocally(list, "zzz", "x")).toBe(list);
  });

  it("describes age in Indonesian", () => {
    const now = Date.parse("2026-09-17T10:30:00Z");
    expect(notificationAge("2026-09-17T10:29:50Z", now)).toBe("baru saja");
    expect(notificationAge("2026-09-17T10:00:00Z", now)).toContain("30 menit");
    expect(notificationAge("2026-09-16T10:30:00Z", now)).toBe("kemarin");
    expect(notificationAge("nope", now)).toBe("");
  });
});
