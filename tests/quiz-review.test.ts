import { describe, expect, it } from "vitest";
import type {
  AnswerFeedback,
  AttemptResult,
} from "@/features/quiz/domain/quiz";
import {
  citationLabels,
  feedbackFor,
  feedbackTitle,
  hasReview,
  optionVerdict,
} from "@/features/quiz/domain/quiz-review";

const wrong: AnswerFeedback = {
  itemId: "i1",
  chosenOptionId: "a",
  correctOptionId: "b",
  isCorrect: false,
  explanation: "karena b",
};
const right: AnswerFeedback = {
  ...wrong,
  itemId: "i2",
  chosenOptionId: "b",
  isCorrect: true,
};

const result = {
  attemptId: "t",
  quizId: "q",
  score: 50,
  correctCount: 1,
  totalItems: 2,
  isPassed: false,
  passingScore: 80,
  dailyStreak: 1,
  lessonCompleted: false,
  answers: [wrong, right],
} satisfies AttemptResult;

describe("quiz review", () => {
  it("finds feedback by item", () => {
    expect(feedbackFor(result, "i2")).toBe(right);
    expect(feedbackFor(result, "nope")).toBeNull();
    expect(feedbackFor(null, "i1")).toBeNull();
  });

  it("marks the right option green and a wrong pick red", () => {
    expect(optionVerdict(wrong, "b")).toBe("correct");
    expect(optionVerdict(wrong, "a")).toBe("wrong");
    expect(optionVerdict(wrong, "c")).toBe("neutral");
    expect(optionVerdict(right, "b")).toBe("correct");
    expect(optionVerdict(null, "b")).toBe("neutral");
  });

  it("labels only the pages the backend knows", () => {
    expect(citationLabels({ pdfPage: 3, slidePage: 2 })).toEqual([
      "PDF Halaman 3",
      "PPT Halaman 2",
    ]);
    expect(citationLabels({ source: "x.pdf" })).toEqual([]);
    expect(citationLabels({ pdfPage: 0 })).toEqual([]);
    expect(citationLabels(undefined)).toEqual([]);
  });

  it("titles by correctness", () => {
    expect(feedbackTitle(right)).toContain("Benar");
    expect(feedbackTitle(wrong)).toContain("Kurang Tepat");
  });

  it("only reviews when answers came back", () => {
    expect(hasReview(result)).toBe(true);
    expect(hasReview({ ...result, answers: [] })).toBe(false);
    expect(hasReview({ ...result, answers: undefined })).toBe(false);
  });
});

import { summarize } from "@/features/quiz/domain/quiz-session";

describe("summarize with a pass mark", () => {
  it("does not praise one mistake on a failed attempt", () => {
    const failed = {
      ...result,
      correctCount: 2,
      totalItems: 3,
      score: 67,
      isPassed: false,
    };
    expect(summarize(failed).encouragement).not.toContain("hampir semua");
    expect(summarize({ ...failed, isPassed: true }).encouragement).toContain(
      "hampir semua",
    );
  });
});

import { isSessionExpired } from "@/features/quiz/domain/quiz-session";

describe("isSessionExpired", () => {
  it("recognises a lost session and nothing else", () => {
    expect(isSessionExpired({ status: 401, code: "HTTP_ERROR" })).toBe(true);
    expect(isSessionExpired({ code: "SESSION_REVOKED" })).toBe(true);
    expect(isSessionExpired({ status: 500, code: "INTERNAL" })).toBe(false);
    expect(isSessionExpired(new Error("x"))).toBe(false);
    expect(isSessionExpired(null)).toBe(false);
  });
});
