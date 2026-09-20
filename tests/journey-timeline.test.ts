import { describe, expect, it } from "vitest";
import type { TrackSummary } from "@/features/journey/domain/session";
import { buildProgressiveTimeline } from "@/features/journey/domain/progressive-generation";
import {
  buildTimeline,
  railProgress,
} from "@/features/journey/domain/timeline";

const track = (count: number): TrackSummary => ({
  id: "t1",
  orderIndex: 1,
  title: "Pengenalan",
  lessons: Array.from({ length: count }, (_, i) => ({
    id: `l${i + 1}`,
    orderIndex: i + 1,
    title: `Sesi ${i + 1}`,
    quizCount: 1,
  })),
});

const withDone = (summary: TrackSummary, done: Iterable<string>) => {
  const ids = new Set(done);
  return {
    ...summary,
    lessons: summary.lessons.map((lesson) =>
      ids.has(lesson.id) ? { ...lesson, status: "completed" } : lesson,
    ),
  };
};

const statuses = (count: number, done: string[]) =>
  buildTimeline(withDone(track(count), done)).sessions.map((s) => s.status);

describe("buildTimeline", () => {
  it("marks the first unfinished session as current and locks the rest", () => {
    expect(statuses(5, ["l1", "l2"])).toEqual([
      "done",
      "done",
      "current",
      "locked",
      "locked",
    ]);
  });

  it("opens the first session for a brand new track", () => {
    expect(statuses(3, [])).toEqual(["current", "locked", "locked"]);
  });

  it("marks everything done when all lessons are complete", () => {
    expect(statuses(3, ["l1", "l2", "l3"])).toEqual(["done", "done", "done"]);
  });

  it("never shows more than one current session", () => {
    for (const done of [[], ["l1"], ["l1", "l2"], ["l1", "l2", "l3"]]) {
      const current = statuses(4, done).filter((s) => s === "current");
      expect(current.length).toBeLessThanOrEqual(1);
    }
  });

  it("respects orderIndex rather than array order", () => {
    const shuffled: TrackSummary = {
      ...track(3),
      lessons: [
        { id: "l3", orderIndex: 3, title: "C", quizCount: 1 },
        { id: "l1", orderIndex: 1, title: "A", quizCount: 1 },
        { id: "l2", orderIndex: 2, title: "B", quizCount: 1 },
      ],
    };
    const built = buildTimeline(withDone(shuffled, ["l1"]));
    expect(built.sessions.map((s) => s.title)).toEqual(["A", "B", "C"]);
    expect(built.sessions.map((s) => s.status)).toEqual([
      "done",
      "current",
      "locked",
    ]);
  });

  it("alternates sides starting on the right, as the design does", () => {
    expect(
      buildTimeline(withDone(track(4), [])).sessions.map((s) => s.side),
    ).toEqual(["right", "left", "right", "left"]);
  });

  it("numbers sessions from one", () => {
    expect(
      buildTimeline(withDone(track(3), [])).sessions.map((s) => s.position),
    ).toEqual([1, 2, 3]);
  });

  it("counts completion for the header", () => {
    const built = buildTimeline(withDone(track(5), ["l1", "l2"]));
    expect(built.completedCount).toBe(2);
    expect(built.totalCount).toBe(5);
    expect(built.progress).toBeCloseTo(0.4);
  });

  it("handles a track with no lessons without dividing by zero", () => {
    const built = buildTimeline(withDone(track(0), []));
    expect(built.sessions).toEqual([]);
    expect(built.progress).toBe(0);
    expect(built.totalCount).toBe(0);
    expect(built.subtitle).toBe("Belum ada sesi");
  });

  it("ignores completions for lessons not in this track", () => {
    expect(statuses(2, ["somewhere-else"])).toEqual(["current", "locked"]);
  });

  it("reads completion from the server's status or completedAt", () => {
    const summary = track(3);
    const lessons = summary.lessons;
    const built = buildTimeline({
      ...summary,
      lessons: [
        {
          ...lessons[0]!,
          status: "unlocked",
          completedAt: "2026-09-17T10:00:00Z",
        },
        { ...lessons[1]!, status: "unlocked", completedAt: null },
        { ...lessons[2]!, status: "unlocked" },
      ],
    });
    expect(built.sessions.map((s) => s.status)).toEqual([
      "done",
      "current",
      "locked",
    ]);
  });

  it("prefers the generated description as the subtitle", () => {
    expect(
      buildTimeline({ ...track(2), description: "Dasar kriptografi" }).subtitle,
    ).toBe("Dasar kriptografi");
    expect(buildTimeline({ ...track(2), description: "  " }).subtitle).toBe(
      "2 sesi belajar",
    );
  });
});

describe("railProgress", () => {
  it("measures gaps crossed, not lessons finished", () => {
    // The rail joins node centres: 1 of 5 done crosses 1 of 4 gaps.
    expect(railProgress(buildTimeline(withDone(track(5), ["l1"])))).toBeCloseTo(
      0.25,
    );
    expect(
      railProgress(buildTimeline(withDone(track(5), ["l1", "l2"]))),
    ).toBeCloseTo(0.5);
  });

  it("is empty before anything is finished", () => {
    expect(railProgress(buildTimeline(withDone(track(4), [])))).toBe(0);
  });

  it("never overshoots when every session is done", () => {
    expect(
      railProgress(buildTimeline(withDone(track(4), ["l1", "l2", "l3", "l4"]))),
    ).toBe(1);
  });

  it("treats a single-session track as all-or-nothing", () => {
    expect(railProgress(buildTimeline(withDone(track(1), [])))).toBe(0);
    expect(railProgress(buildTimeline(withDone(track(1), ["l1"])))).toBe(1);
  });
});


describe("buildProgressiveTimeline", () => {
  it("opens only session one while later generated lessons stay locked", () => {
    const track = buildProgressiveTimeline({
      generationId: "gen-1",
      spaceId: "space-1",
      status: "running",
      stage: "generating_lessons",
      progress: { completed: 3, total: 4 },
      lessons: [
        {
          conceptId: "c1",
          orderIndex: 1,
          status: "completed",
          title: "Sesi Pertama",
          contentMarkdown: "# Ready 1",
        },
        {
          conceptId: "c2",
          orderIndex: 2,
          status: "running",
        },
        {
          conceptId: "c3",
          orderIndex: 3,
          status: "completed",
          title: "Sesi Ketiga",
          contentMarkdown: "# Ready 3",
        },
        {
          conceptId: "c4",
          orderIndex: 4,
          status: "completed",
          title: "Sesi Keempat",
          contentMarkdown: "# Ready 4",
        },
      ],
    });

    expect(track.sessions.map((session) => session.status)).toEqual([
      "current",
      "locked",
      "locked",
      "locked",
    ]);
    expect(track.sessions[0]?.previewMarkdown).toBe("# Ready 1");
    expect(track.sessions[2]?.previewMarkdown).toBeUndefined();
    expect(track.generationProgress).toEqual({ completed: 3, total: 4 });
    expect(track.completedCount).toBe(0);
  });
});
