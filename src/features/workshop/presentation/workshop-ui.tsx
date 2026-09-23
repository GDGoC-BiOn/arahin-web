"use client";

import type { ReactNode } from "react";
import type {
  WorkshopAttemptResult,
  WorkshopQuizOption as WorkshopQuizOptionType,
} from "../domain/workshop";

export type WorkshopStepStatus = "done" | "current" | "locked";

export function WorkshopFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-canvas px-4 py-8 text-ink sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {children}
      </div>
    </main>
  );
}

export function JourneyStep({
  position,
  title,
  status,
  onOpen,
}: {
  position: number;
  title: string;
  status: WorkshopStepStatus;
  onOpen: () => void;
}) {
  const locked = status === "locked";
  const marker = status === "done" ? "✓" : status === "current" ? "●" : "🔒";

  return (
    <li className="grid grid-cols-[48px_1fr] items-center gap-3">
      <button
        type="button"
        disabled={locked}
        onClick={onOpen}
        className={
          status === "locked"
            ? "flex size-12 cursor-not-allowed items-center justify-center rounded-full border border-[#cbd5e1] bg-[#f1f5f9] text-sm text-subtle"
            : "flex size-12 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white"
        }
        aria-label={`Sesi ${position}: ${title}${locked ? " terkunci" : ""}`}
      >
        {marker}
      </button>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-subtle">Sesi {position}</p>
        <p className="truncate text-sm font-bold">{title}</p>
      </div>
    </li>
  );
}

export function WorkshopQuizOption({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: WorkshopQuizOptionType;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed ${
        selected
          ? "border-primary-500 bg-primary-100 font-semibold text-primary-500"
          : "border-[#cbd5e1] bg-white text-[#334155]"
      }`}
    >
      <span className="mr-2 font-bold uppercase">{option.id}.</span>
      {option.label}
    </button>
  );
}

export function ResultPanel({ result }: { result: WorkshopAttemptResult }) {
  return (
    <section className="rounded-[24px] border border-[#cbd5e1] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
        Real API result
      </p>
      <div className="mt-2 flex items-end gap-2">
        <strong className="text-4xl text-primary-500">{result.score}</strong>
        <span className="pb-1 text-sm text-subtle">score</span>
      </div>
      <p className="mt-2 text-sm text-[#475569]">
        {result.correctCount}/{result.totalItems} jawaban benar ·{" "}
        {result.isPassed ? "Lulus" : "Belum lulus"}
      </p>

      {result.answers?.length ? (
        <div className="mt-5 flex flex-col gap-3">
          {result.answers.map((answer, index) => (
            <article
              key={answer.itemId}
              className="rounded-2xl bg-[#f8fafc] p-4 text-sm"
            >
              <p
                className={
                  answer.isCorrect
                    ? "font-bold text-success"
                    : "font-bold text-[#e71e43]"
                }
              >
                Soal {index + 1}: {answer.isCorrect ? "Benar" : "Belum tepat"}
              </p>
              <p className="mt-1 text-xs text-[#64748b]">
                Pilihan kamu: {answer.chosenOptionId.toUpperCase()} · Jawaban:{" "}
                {answer.correctOptionId.toUpperCase()}
              </p>
              {answer.explanation ? (
                <p className="mt-2 text-xs leading-5 text-[#475569]">
                  {answer.explanation}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
