import type { AnswerFeedback, AttemptResult, Citation } from "./quiz";

/** How one option looks once the quiz has been graded. */
export type OptionVerdict = "correct" | "wrong" | "neutral";

export function feedbackFor(
  result: AttemptResult | null,
  itemId: string,
): AnswerFeedback | null {
  return result?.answers?.find((answer) => answer.itemId === itemId) ?? null;
}

/**
 * The right option always shows green; the learner's own pick shows red only
 * when it was wrong. Everything else stays neutral, as in the design.
 */
export function optionVerdict(
  feedback: AnswerFeedback | null,
  optionId: string,
): OptionVerdict {
  if (!feedback) return "neutral";
  if (optionId === feedback.correctOptionId) return "correct";
  if (optionId === feedback.chosenOptionId) return "wrong";
  return "neutral";
}

/** The "PDF Halaman 3 / PPT Halaman 2" chips — only pages the backend knows. */
export function citationLabels(citation: Citation | undefined): string[] {
  const labels: string[] = [];
  if (citation?.pdfPage && citation.pdfPage > 0) {
    labels.push(`PDF Halaman ${citation.pdfPage}`);
  }
  if (citation?.slidePage && citation.slidePage > 0) {
    labels.push(`PPT Halaman ${citation.slidePage}`);
  }
  return labels;
}

export function feedbackTitle(feedback: AnswerFeedback): string {
  return feedback.isCorrect
    ? "Yeyyy...Jawaban Benar!"
    : "Yahh...Jawaban Kurang Tepat";
}

/** Whether the backend sent per-answer feedback worth walking through. */
export function hasReview(result: AttemptResult | null): boolean {
  return Boolean(result?.answers?.length);
}
