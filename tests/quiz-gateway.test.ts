import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { describe, expect, it } from "vitest";
import { createBrowserQuizGateway } from "@/features/quiz/infrastructure/browser-quiz-gateway";

describe("browser quiz gateway result contracts", () => {
  it("accepts the activity grading response without a legacy attempt id", async () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const gateway = createBrowserQuizGateway(client);

    mock
      .onPost("/lessons/lesson-1/activities/activity-1/submit")
      .reply(200, {
        activityId: "activity-1",
        lessonId: "lesson-1",
        kind: "quiz",
        score: 67,
        correctCount: 2,
        totalItems: 3,
        isPassed: false,
        passingScore: 70,
        mastery: 67,
        reviewIntervalDays: 0,
        reviewDueAt: "2026-09-25T00:00:00Z",
        lessonCompleted: true,
        xpEarned: 10,
        answers: [
          {
            itemId: "item-1",
            chosenOptionId: "a",
            correctOptionId: "b",
            isCorrect: false,
            explanation: "Because B is correct.",
          },
        ],
      });

    const result = await gateway.submit({
      source: {
        kind: "activity",
        lessonId: "lesson-1",
        activityId: "activity-1",
      },
      answers: [{ itemId: "item-1", optionId: "a" }],
    });

    expect(result).toMatchObject({
      attemptId: "",
      quizId: "",
      dailyStreak: 0,
      score: 67,
      mastery: 67,
      lessonCompleted: true,
    });
  });

  it("keeps the legacy quiz-attempt contract strict", async () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const gateway = createBrowserQuizGateway(client);

    mock.onPost("/quiz-attempts").reply(201, {
      attemptId: "attempt-1",
      quizId: "quiz-1",
      score: 100,
      correctCount: 1,
      totalItems: 1,
      isPassed: true,
      passingScore: 70,
      dailyStreak: 2,
      lessonCompleted: true,
      xpEarned: 20,
      answers: [],
    });

    const result = await gateway.submit({
      source: { kind: "quiz", quizId: "quiz-1" },
      answers: [{ itemId: "item-1", optionId: "a" }],
    });

    expect(result).toMatchObject({
      attemptId: "attempt-1",
      quizId: "quiz-1",
      dailyStreak: 2,
      score: 100,
    });
  });

  it("rejects an activity response that does not match the backend contract", async () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const gateway = createBrowserQuizGateway(client);

    mock
      .onPost("/lessons/lesson-1/activities/activity-1/submit")
      .reply(200, {
        score: 100,
        correctCount: 1,
        totalItems: 1,
        isPassed: true,
      });

    await expect(
      gateway.submit({
        source: {
          kind: "activity",
          lessonId: "lesson-1",
          activityId: "activity-1",
        },
        answers: [{ itemId: "item-1", optionId: "a" }],
      }),
    ).rejects.toThrow();
  });
});
