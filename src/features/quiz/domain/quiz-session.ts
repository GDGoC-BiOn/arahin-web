import type { AttemptResult, QuizAnswer, QuizItem } from "./quiz";

/** Which way the deck last moved, so a transition travels the right way. */
export type QuizDirection = -1 | 0 | 1;

export type QuizSession = {
  index: number;
  direction: QuizDirection;
  /** itemId -> optionId. One answer per item; re-picking replaces. */
  answers: Readonly<Record<string, string>>;
};

export const INITIAL_QUIZ_SESSION: QuizSession = {
  index: 0,
  direction: 0,
  answers: {},
};

function clamp(index: number, count: number): number {
  if (index < 0) return 0;
  const last = Math.max(count - 1, 0);
  return index > last ? last : index;
}

export function selectOption(
  session: QuizSession,
  itemId: string,
  optionId: string,
): QuizSession {
  // Replace rather than append: a quiz item takes exactly one answer, and the
  // backend rejects nothing here — it would simply grade the duplicate.
  return { ...session, answers: { ...session.answers, [itemId]: optionId } };
}

export function goNext(session: QuizSession, count: number): QuizSession {
  const index = clamp(session.index + 1, count);
  if (index === session.index) return session;
  return { ...session, index, direction: 1 };
}

export function goPrevious(session: QuizSession): QuizSession {
  const index = clamp(session.index - 1, Number.POSITIVE_INFINITY);
  if (index === session.index) return session;
  return { ...session, index, direction: -1 };
}

export function answerFor(session: QuizSession, itemId: string): string | null {
  return session.answers[itemId] ?? null;
}

export function isAnswered(session: QuizSession, itemId: string): boolean {
  return itemId in session.answers;
}

export function answeredCount(session: QuizSession, items: QuizItem[]): number {
  return items.filter((item) => item.id in session.answers).length;
}

/** Every item answered — the only point at which submitting is meaningful. */
export function isComplete(session: QuizSession, items: QuizItem[]): boolean {
  return items.length > 0 && answeredCount(session, items) === items.length;
}

/**
 * The exact shape `POST /v1/quiz-attempts` expects. Ordered by the items
 * themselves rather than by insertion, and answers for items outside this quiz
 * are dropped — the backend ignores them anyway, and sending them would be
 * noise.
 */
export function toAnswers(
  session: QuizSession,
  items: QuizItem[],
): QuizAnswer[] {
  const answers: QuizAnswer[] = [];
  for (const item of items) {
    const optionId = session.answers[item.id];
    if (optionId) answers.push({ itemId: item.id, optionId });
  }
  return answers;
}

export type AttemptSummary = {
  correct: number;
  wrong: number;
  score: number;
  encouragement: string;
};

/**
 * Everything the result modal shows, derived from the aggregates the backend
 * actually returns. The design hardcodes "Dengan hanya 1 kesalahan…"; that
 * sentence is generated here so it can never contradict the real numbers.
 */
export function summarize(result: AttemptResult): AttemptSummary {
  const total = Math.max(result.totalItems, 0);
  const correct = Math.min(Math.max(result.correctCount, 0), total);
  const wrong = total - correct;

  let encouragement: string;
  if (total === 0) {
    encouragement = "Kuis ini belum punya soal.";
  } else if (wrong === 0) {
    encouragement = "Sempurna! Kamu menjawab semua soal dengan benar.";
  } else if (correct === 0) {
    encouragement =
      "Belum ada yang benar. Coba baca lagi materinya, lalu ulangi kuis.";
  } else if (wrong === 1 && result.isPassed) {
    encouragement =
      "Yay! Kamu berhasil menyelesaikan quiz. Dengan hanya 1 kesalahan, kamu sudah menguasai hampir semua materi.";
  } else {
    encouragement = `Kamu menjawab ${correct} dari ${total} soal dengan benar. Tinjau ${wrong} soal yang belum tepat, ya.`;
  }

  return { correct, wrong, score: result.score, encouragement };
}

/**
 * A rejected submit whose session is gone. Retrying can never succeed, so the
 * screen offers a way to sign in again instead of "Coba lagi" forever.
 */
export function isSessionExpired(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { status, code } = error as { status?: unknown; code?: unknown };
  return (
    status === 401 ||
    code === "UNAUTHORIZED" ||
    code === "UNAUTHENTICATED" ||
    code === "SESSION_REVOKED" ||
    code === "INVALID_TOKEN"
  );
}
