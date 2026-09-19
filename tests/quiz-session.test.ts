import { describe, expect, it } from "vitest";
import type { AttemptResult, QuizItem } from "@/features/quiz/domain/quiz";
import {
  answeredCount,
  answerFor,
  goNext,
  goPrevious,
  INITIAL_QUIZ_SESSION,
  isComplete,
  selectOption,
  summarize,
  toAnswers,
} from "@/features/quiz/domain/quiz-session";

const items: QuizItem[] = [1, 2, 3].map((n) => ({
  id: `i${n}`,
  orderIndex: n,
  question: `Q${n}`,
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
}));

const result = (over: Partial<AttemptResult> = {}): AttemptResult => ({
  attemptId: "att",
  quizId: "q",
  score: 100,
  correctCount: 3,
  totalItems: 3,
  isPassed: true,
  passingScore: 70,
  dailyStreak: 1,
  lessonCompleted: true,
  ...over,
});

describe("selectOption", () => {
  it("records one answer per item", () => {
    const s = selectOption(INITIAL_QUIZ_SESSION, "i1", "a");
    expect(answerFor(s, "i1")).toBe("a");
    expect(answerFor(s, "i2")).toBeNull();
  });

  it("replaces rather than appends when re-picking", () => {
    let s = selectOption(INITIAL_QUIZ_SESSION, "i1", "a");
    s = selectOption(s, "i1", "b");
    expect(answerFor(s, "i1")).toBe("b");
    expect(Object.keys(s.answers)).toHaveLength(1);
  });

  it("does not mutate the previous session", () => {
    const first = selectOption(INITIAL_QUIZ_SESSION, "i1", "a");
    selectOption(first, "i2", "b");
    expect(Object.keys(first.answers)).toEqual(["i1"]);
    expect(INITIAL_QUIZ_SESSION.answers).toEqual({});
  });
});

describe("navigation", () => {
  it("advances and records the direction", () => {
    expect(goNext(INITIAL_QUIZ_SESSION, 3)).toMatchObject({
      index: 1,
      direction: 1,
    });
  });

  it("clamps at the last item without re-triggering a transition", () => {
    const last = { ...INITIAL_QUIZ_SESSION, index: 2, direction: 1 as const };
    expect(goNext(last, 3)).toBe(last);
  });

  it("goes back and clamps at the first item", () => {
    expect(goPrevious({ ...INITIAL_QUIZ_SESSION, index: 2 })).toMatchObject({
      index: 1,
      direction: -1,
    });
    expect(goPrevious(INITIAL_QUIZ_SESSION)).toBe(INITIAL_QUIZ_SESSION);
  });

  it("keeps answers while moving between items", () => {
    let s = selectOption(INITIAL_QUIZ_SESSION, "i1", "a");
    s = goNext(s, 3);
    s = selectOption(s, "i2", "b");
    s = goPrevious(s);
    expect(answerFor(s, "i1")).toBe("a");
    expect(answerFor(s, "i2")).toBe("b");
  });
});

describe("isComplete", () => {
  it("is false until every item is answered", () => {
    let s = selectOption(INITIAL_QUIZ_SESSION, "i1", "a");
    expect(isComplete(s, items)).toBe(false);
    s = selectOption(s, "i2", "a");
    expect(isComplete(s, items)).toBe(false);
    s = selectOption(s, "i3", "a");
    expect(isComplete(s, items)).toBe(true);
  });

  it("is false for a quiz with no items, not vacuously true", () => {
    expect(isComplete(INITIAL_QUIZ_SESSION, [])).toBe(false);
  });

  it("ignores answers for items outside this quiz", () => {
    const s = selectOption(INITIAL_QUIZ_SESSION, "elsewhere", "a");
    expect(answeredCount(s, items)).toBe(0);
    expect(isComplete(s, items)).toBe(false);
  });
});

describe("toAnswers", () => {
  it("produces exactly the backend's shape, ordered by item", () => {
    let s = selectOption(INITIAL_QUIZ_SESSION, "i3", "b");
    s = selectOption(s, "i1", "a");
    expect(toAnswers(s, items)).toEqual([
      { itemId: "i1", optionId: "a" },
      { itemId: "i3", optionId: "b" },
    ]);
  });

  it("drops answers for items not in the quiz", () => {
    const s = selectOption(INITIAL_QUIZ_SESSION, "ghost", "a");
    expect(toAnswers(s, items)).toEqual([]);
  });
});

describe("summarize", () => {
  it("derives wrong from the aggregates the backend returns", () => {
    expect(
      summarize(result({ correctCount: 7, totalItems: 8, score: 88 })),
    ).toMatchObject({
      correct: 7,
      wrong: 1,
      score: 88,
    });
  });

  it("never reports a negative count", () => {
    // Defensive: a malformed payload must not render "-2 Jawaban Salah".
    const s = summarize(result({ correctCount: 5, totalItems: 3 }));
    expect(s.wrong).toBe(0);
    expect(s.correct).toBe(3);
  });

  it("handles an empty quiz without dividing by zero", () => {
    const s = summarize(result({ correctCount: 0, totalItems: 0, score: 0 }));
    expect(s).toMatchObject({ correct: 0, wrong: 0 });
    expect(Number.isNaN(s.score)).toBe(false);
    expect(s.encouragement).toContain("belum punya soal");
  });

  it("says something different for perfect, near-perfect and zero", () => {
    expect(
      summarize(result({ correctCount: 3, totalItems: 3 })).encouragement,
    ).toContain("Sempurna");
    expect(
      summarize(result({ correctCount: 7, totalItems: 8 })).encouragement,
    ).toContain("1 kesalahan");
    expect(
      summarize(result({ correctCount: 0, totalItems: 4 })).encouragement,
    ).toContain("Belum ada yang benar");
    expect(
      summarize(result({ correctCount: 2, totalItems: 5 })).encouragement,
    ).toContain("2 dari 5");
  });
});
