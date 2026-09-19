"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckLargeIcon } from "@/shared/presentation/icons";
import type { AttemptResult } from "../domain/quiz";
import { summarize } from "../domain/quiz-session";
import { FADE, MODAL_SPRING, PRESS, SCORE_SPRING } from "./motion-tokens";

/** The six decorative dots, static as in the design. */
const DOTS = [
  { cls: "size-1.5 bg-primary-500", style: { left: 114, top: 16 } },
  { cls: "size-1.5 bg-primary-500", style: { left: 14, top: 29 } },
  { cls: "size-1.5 bg-primary-500", style: { left: 120, top: 79 } },
  { cls: "size-3 bg-primary-100", style: { left: 2, top: 57 } },
  { cls: "size-3 bg-primary-100", style: { left: 131, top: 42 } },
  { cls: "size-3 bg-primary-100", style: { left: 0, top: 0 } },
] as const;

export function QuizResultModal({
  result,
  onNext,
  onRetry,
}: {
  result: AttemptResult | null;
  onNext: () => void;
  onRetry: () => void;
}) {
  return (
    <AnimatePresence>
      {result ? (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            className="absolute inset-0 z-10 bg-black/30"
          />
          <motion.div
            key="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-result-title"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={MODAL_SPRING}
            className="absolute inset-x-[30px] top-[149px] z-20 flex max-h-[calc(100%-180px)] flex-col items-center gap-6 overflow-y-auto rounded-[20px] bg-[#f8fafc] p-5"
          >
            <ResultBadge />
            <ResultCopy passed={result.isPassed} />
            {typeof result.mastery === "number" || result.reviewIntervalDays ? (
              <p className="-mt-3 text-center text-xs leading-[1.4] text-[#64748b]">
                {typeof result.mastery === "number"
                  ? `Penguasaan materi ${result.mastery}%`
                  : null}
                {typeof result.mastery === "number" && result.reviewIntervalDays
                  ? " · "
                  : null}
                {result.reviewIntervalDays
                  ? `Ulas lagi dalam ${result.reviewIntervalDays} hari`
                  : null}
              </p>
            ) : null}
            {result.xpEarned ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...MODAL_SPRING, delay: 0.25 }}
                className="-mt-3 rounded-2xl bg-amber-soft px-3 py-1 text-xs font-bold text-amber"
              >
                +{result.xpEarned} XP
              </motion.span>
            ) : null}
            <ResultScore result={result} />
            <div className="flex w-full flex-col gap-3">
              <motion.button
                type="button"
                onClick={onNext}
                whileTap={{ scale: 0.98 }}
                transition={PRESS}
                className="w-full rounded-[20px] bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-white"
              >
                Selanjutnya
              </motion.button>
              <motion.button
                type="button"
                onClick={onRetry}
                whileTap={{ scale: 0.98 }}
                transition={PRESS}
                className="w-full rounded-[20px] bg-primary-100 px-3.5 py-2 text-sm leading-5 font-semibold text-primary-500"
              >
                Ulangi Quiz
              </motion.button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ResultBadge() {
  return (
    <div className="relative h-[85px] w-[143px] shrink-0" aria-hidden="true">
      {DOTS.map((dot) => (
        <span
          key={`${dot.style.left}-${dot.style.top}`}
          className={`absolute rounded-full ${dot.cls}`}
          style={dot.style}
        />
      ))}
      <span className="absolute top-5 left-[37px] flex size-[70px] items-center justify-center rounded-[32px] border-[12.8px] border-primary-100 bg-primary-500 text-white shadow-[0px_2.56px_5.12px_0px_rgba(16,24,40,0.05)]">
        <CheckLargeIcon className="size-8" />
      </span>
    </div>
  );
}

function ResultCopy({ passed }: { passed: boolean }) {
  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <h2
        id="quiz-result-title"
        className="text-xl leading-[1.25] font-bold text-[#0f172a]"
      >
        Quiz Selesai
      </h2>
      <p className="text-sm leading-[1.25] text-[#64748b]">
        {passed
          ? "Kerja bagus! Kamu telah menyelesaikan seluruh pertanyaan. Yuk, lihat hasilnya."
          : "Kamu sudah menyelesaikan seluruh pertanyaan. Belum lulus kali ini — yuk, coba lagi."}
      </p>
    </div>
  );
}

function ResultScore({ result }: { result: AttemptResult }) {
  const summary = summarize(result);
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-[20px] border border-[#cbd5e1] bg-[#f1f5f9] p-5">
        <p className="text-xs leading-[1.25] font-bold text-[#0f172a]">
          Hasil Pengerjaanmu
        </p>
        <div className="flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded bg-primary-100"
            role="progressbar"
            aria-valuenow={summary.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Skor kuis"
          >
            {/* Only the bar animates. The numeral is the thing you came for,
                so it appears at its final value straight away. */}
            <motion.div
              className="h-full origin-left rounded bg-primary-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: summary.score / 100 }}
              transition={{ ...SCORE_SPRING, delay: 0.18 }}
            />
          </div>
          <span className="text-sm leading-[1.25] font-bold text-primary-500">
            {summary.score}
          </span>
        </div>
        <p className="text-xs leading-[1.25] text-[#64748b]">
          {summary.encouragement}
        </p>
      </div>

      <div className="flex gap-3">
        <ScoreTile value={summary.correct} label="Jawaban Benar" />
        <ScoreTile value={summary.wrong} label="Jawaban Salah" />
      </div>
    </div>
  );
}

function ScoreTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-xl border border-[#cbd5e1] bg-[#f1f5f9] p-3.5">
      <span className="text-sm font-bold text-[#0f172a]">{value}</span>
      <span className="text-xs leading-[1.25] text-[#64748b]">{label}</span>
    </div>
  );
}
