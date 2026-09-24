"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftSmallIcon,
  CheckLargeIcon,
  CheckSmallIcon,
  LockIcon,
  XSmallIcon,
} from "@/shared/presentation/icons";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import type {
  WorkshopAnswerFeedback,
  WorkshopAttemptResult,
  WorkshopQuizOption as WorkshopQuizOptionType,
} from "../domain/workshop";

export type WorkshopStepStatus = "done" | "current" | "locked";

export type WorkshopJourneyStep = {
  id: string;
  position: number;
  title: string;
  status: WorkshopStepStatus;
  side: "left" | "right";
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const PRESS = { duration: 0.14, ease: EASE_OUT } as const;
const FADE = { duration: 0.24, ease: EASE_OUT } as const;
const OPTION_TINT = { duration: 0.14, ease: EASE_OUT } as const;
const LABEL_SWAP = { duration: 0.18, ease: EASE_OUT } as const;
const RAIL_SPRING = { type: "spring", duration: 0.7, bounce: 0 } as const;
const NODE_SPRING = {
  type: "spring",
  duration: 0.45,
  bounce: 0.22,
} as const;
const QUESTION_SPRING = {
  type: "spring",
  duration: 0.45,
  bounce: 0.12,
} as const;
const MODAL_SPRING = {
  type: "spring",
  duration: 0.5,
  bounce: 0.15,
} as const;
const SCORE_SPRING = {
  type: "spring",
  duration: 0.6,
  bounce: 0,
} as const;
const NODE_STAGGER = 0.06;
const OPTION_STAGGER = 0.04;
const NODE_SPACING = 130;
const QUESTION_OFFSET = 28;

export function WorkshopJourneyScreen({
  title,
  subtitle,
  steps,
  loading,
  error,
  onBack,
  onOpen,
}: {
  title: string;
  subtitle: string;
  steps: WorkshopJourneyStep[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onOpen: (step: WorkshopJourneyStep) => void;
}) {
  const completedCount = steps.filter((step) => step.status === "done").length;
  const totalCount = steps.length;
  const headerProgress = totalCount === 0 ? 0 : completedCount / totalCount;
  const railGaps = Math.max(totalCount - 1, 0);
  const railProgress =
    railGaps <= 0
      ? completedCount > 0
        ? 1
        : 0
      : Math.min(completedCount / railGaps, 1);
  const railHeight = railGaps * NODE_SPACING;

  return (
    <AppPanel>
      <main id="main" className="relative flex flex-1 flex-col overflow-y-auto">
        {loading ? (
          <div className="flex flex-col">
            <div className="h-[148px] rounded-b-[40px] bg-primary-500" />
            <div className="flex flex-col items-center gap-[66px] px-6 pt-16">
              {["a", "b", "c"].map((key) => (
                <span
                  key={key}
                  className="size-16 rounded-[32px] border border-[#cbd5e1] bg-[#f1f5f9]"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-3 rounded-b-[40px] bg-primary-500 px-6 py-4">
              <div className="flex items-center gap-4">
                <motion.button
                  type="button"
                  onClick={onBack}
                  aria-label="Kembali"
                  whileTap={{ scale: 0.92 }}
                  transition={PRESS}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-white"
                >
                  <ArrowLeftSmallIcon className="size-4" />
                </motion.button>
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-xl leading-[1.25] font-bold text-white">
                    {title}
                  </p>
                  <p className="truncate text-xs leading-[1.25] text-[#f8fafc]">
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-white/30"
                  role="progressbar"
                  aria-valuenow={completedCount}
                  aria-valuemin={0}
                  aria-valuemax={totalCount}
                  aria-label="Sesi selesai"
                >
                  <motion.div
                    className="h-full origin-left rounded-full bg-white"
                    initial={false}
                    animate={{ scaleX: headerProgress }}
                    transition={RAIL_SPRING}
                  />
                </div>
              </div>

              <p className="text-xs leading-[1.25] text-[#f8fafc]">
                {completedCount}/{totalCount} sesi selesai
              </p>
            </header>

            {steps.length ? (
              <div className="relative px-6 pt-8 pb-10">
                {steps.length > 1 ? (
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 w-1 -translate-x-1/2 rounded-full bg-[#eaedfd]"
                    style={{ top: 64, height: railHeight }}
                  >
                    <motion.div
                      className="w-full origin-top rounded-full bg-primary-500"
                      initial={false}
                      animate={{ scaleY: railProgress }}
                      transition={RAIL_SPRING}
                      style={{ height: railHeight }}
                    />
                  </div>
                ) : null}

                <ol
                  className="relative flex flex-col"
                  style={{ gap: NODE_SPACING - 64 }}
                  aria-label="Daftar sesi"
                >
                  {steps.map((step, index) => (
                    <li key={step.id}>
                      <WorkshopSessionNode
                        step={step}
                        index={index}
                        onOpen={onOpen}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
                <p className="text-base font-bold text-ink">Belum ada sesi</p>
                <p className="text-xs leading-[1.5] text-subtle">
                  Materi belajar dibuat setelah dokumen kamu diproses AI.
                </p>
              </div>
            )}
          </>
        )}

        {error ? (
          <div className="absolute inset-x-6 top-44 z-10 rounded-[20px] bg-[#fff1f2] p-4 text-center">
            <p role="alert" className="text-sm font-semibold text-[#e71e43]">
              {error}
            </p>
          </div>
        ) : null}
      </main>
    </AppPanel>
  );
}

function WorkshopSessionNode({
  step,
  index,
  onOpen,
}: {
  step: WorkshopJourneyStep;
  index: number;
  onOpen: (step: WorkshopJourneyStep) => void;
}) {
  const reached = step.status !== "locked";
  const locked = step.status === "locked";

  return (
    <div className="grid grid-cols-[1fr_64px_1fr] items-center gap-5">
      {step.side === "left" ? (
        <SessionLabel step={step} align="right" />
      ) : (
        <span />
      )}

      <motion.span
        className="col-start-2"
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...NODE_SPRING, delay: index * NODE_STAGGER }}
      >
        <motion.button
          type="button"
          onClick={() => onOpen(step)}
          disabled={locked}
          aria-label={`Sesi ${step.position}: ${step.title}${locked ? " (terkunci)" : ""}`}
          whileTap={locked ? undefined : { scale: 0.95 }}
          transition={PRESS}
          className={`flex size-16 items-center justify-center rounded-[32px] disabled:cursor-not-allowed ${
            reached
              ? "border-[7px] border-[#d9defb] bg-primary-500 text-[#f8fafc]"
              : "border border-[#cbd5e1] bg-[#f1f5f9] text-subtle"
          }`}
        >
          {step.status === "done" ? (
            <CheckLargeIcon className="size-[26px]" />
          ) : step.status === "current" ? (
            <span className="block size-3 rounded-full bg-white" />
          ) : (
            <LockIcon className="size-[22px]" />
          )}
        </motion.button>
      </motion.span>

      {step.side === "right" ? (
        <SessionLabel step={step} align="left" />
      ) : (
        <span />
      )}
    </div>
  );
}

function SessionLabel({
  step,
  align,
}: {
  step: WorkshopJourneyStep;
  align: "left" | "right";
}) {
  const reached = step.status !== "locked";
  return (
    <span
      className={`flex flex-col gap-px ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span
        className={`text-sm leading-[1.25] font-bold ${
          reached ? "text-primary-500" : "text-[#9ca3af]"
        }`}
      >
        Sesi {step.position}
      </span>
      <span
        className={`text-xs leading-[1.25] ${
          reached ? "text-subtle" : "text-[#9ca3af]"
        }`}
      >
        {step.title}
      </span>
    </span>
  );
}

type OptionVerdict = "correct" | "wrong" | "neutral";

export function WorkshopQuizScreen({
  question,
  questionIndex,
  questionCount,
  options,
  selectedOption,
  reviewing,
  feedback,
  canGoBack,
  complete,
  submitting,
  error,
  result,
  showResult,
  onBack,
  onSelect,
  onPrevious,
  onNext,
  onSubmit,
  onReviewNext,
  onFinish,
  onRetry,
}: {
  question: string;
  questionIndex: number;
  questionCount: number;
  options: WorkshopQuizOptionType[];
  selectedOption?: string;
  reviewing: boolean;
  feedback: WorkshopAnswerFeedback | null;
  canGoBack: boolean;
  complete: boolean;
  submitting: boolean;
  error: string | null;
  result: WorkshopAttemptResult | null;
  showResult: boolean;
  onBack: () => void;
  onSelect: (optionId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onReviewNext: () => void;
  onFinish: () => void;
  onRetry: () => void;
}) {
  const isLast = questionCount > 0 && questionIndex === questionCount - 1;
  const answered = Boolean(selectedOption);

  return (
    <AppPanel surface="bg-[#f8fafc]">
      <main
        id="main"
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain ${
          reviewing ? "pb-80" : "pb-40"
        }`}
      >
        <header className="relative flex min-h-[293px] shrink-0 flex-col overflow-hidden rounded-b-[40px] bg-primary-500 pb-10">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[60px] left-1/2 h-[231px] w-[256px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
          />
          <div className="relative flex items-center gap-3 p-[19px]">
            <motion.button
              type="button"
              onClick={onBack}
              aria-label="Kembali"
              whileTap={{ scale: 0.92 }}
              transition={PRESS}
              className="flex shrink-0 items-center justify-center rounded-[20px] bg-primary-600 p-2 text-white"
            >
              <ArrowLeftSmallIcon className="size-5" />
            </motion.button>

            <div className="flex flex-1 items-center gap-3">
              <div
                className="h-2 flex-1 overflow-hidden rounded bg-primary-600"
                role="progressbar"
                aria-valuenow={questionIndex + 1}
                aria-valuemin={1}
                aria-valuemax={Math.max(questionCount, 1)}
                aria-label="Kemajuan kuis"
              >
                <motion.div
                  className="h-full origin-left rounded bg-white"
                  initial={false}
                  animate={{
                    scaleX:
                      questionCount > 0 ? (questionIndex + 1) / questionCount : 0,
                  }}
                  transition={QUESTION_SPRING}
                />
              </div>
              <span className="text-sm leading-[1.25] font-bold text-[#f8fafc]">
                {questionCount ? questionIndex + 1 : 0}/{questionCount}
              </span>
            </div>
          </div>

          <div className="relative mx-auto flex w-[294px] flex-col items-center gap-5 pt-[57px]">
            <span className="rounded-2xl bg-white px-2.5 py-0.5 text-xs leading-[18px] font-semibold text-[#146af7]">
              Quiz
            </span>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.h1
                key={questionIndex}
                initial={{ x: QUESTION_OFFSET, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -QUESTION_OFFSET, opacity: 0 }}
                transition={QUESTION_SPRING}
                className="text-center text-base leading-[1.25] font-bold text-[#f8fafc]"
              >
                {question}
              </motion.h1>
            </AnimatePresence>
          </div>
        </header>

        <div className="flex flex-col gap-3 px-[18px] pt-8">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="flex flex-col gap-3"
            >
              {options.map((option, index) => (
                <WorkshopQuizOption
                  key={option.id}
                  option={option}
                  selected={selectedOption === option.id}
                  index={index}
                  verdict={
                    reviewing
                      ? verdictFor(feedback, option.id)
                      : null
                  }
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {error ? (
            <p role="alert" className="pt-2 text-xs font-semibold text-[#e71e43]">
              {error}
            </p>
          ) : null}
        </div>
      </main>

      {reviewing ? null : (
        <SubmitDock
          canGoBack={canGoBack}
          isLast={isLast}
          answered={answered}
          complete={complete}
          submitting={submitting}
          onPrevious={onPrevious}
          onNext={onNext}
          onSubmit={onSubmit}
        />
      )}

      <FeedbackSheet
        feedback={reviewing ? feedback : null}
        isLast={isLast}
        onNext={onReviewNext}
      />

      <WorkshopResultModal
        result={showResult ? result : null}
        onNext={onFinish}
        onRetry={onRetry}
      />
    </AppPanel>
  );
}

function WorkshopQuizOption({
  option,
  selected,
  index,
  verdict,
  onSelect,
}: {
  option: WorkshopQuizOptionType;
  selected: boolean;
  index: number;
  verdict: OptionVerdict | null;
  onSelect: (optionId: string) => void;
}) {
  const graded = verdict !== null;
  const tone = graded ? verdict : selected ? "selected" : "neutral";

  const chip = {
    selected: "#3d6bec",
    correct: "#1f8851",
    wrong: "#e71e43",
    neutral: "#e2e8f0",
  }[tone];

  const classes = {
    selected: "border-primary-300 bg-primary-100",
    correct: "border-[#3ae18b] bg-success-soft",
    wrong: "border-[#f9a3b1] bg-[#fddadc]",
    neutral: "border-[#cbd5e1] bg-[#f1f5f9]",
  }[tone];

  const labelClasses = {
    selected: "text-primary-500",
    correct: "text-success",
    wrong: "text-[#e71e43]",
    neutral: "text-subtle",
  }[tone];

  return (
    <motion.button
      type="button"
      onClick={graded ? undefined : () => onSelect(option.id)}
      aria-pressed={graded ? undefined : selected}
      aria-disabled={graded || undefined}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...QUESTION_SPRING, delay: index * OPTION_STAGGER }}
      whileTap={graded ? undefined : { scale: 0.99 }}
      className={`flex w-full items-center gap-2 overflow-hidden rounded-[20px] border py-2 pr-3.5 pl-2.5 text-left shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] transition-colors duration-150 ease-out ${classes} ${
        graded ? "cursor-default" : ""
      }`}
    >
      <motion.span
        initial={false}
        animate={{ backgroundColor: chip }}
        transition={OPTION_TINT}
        className={`flex shrink-0 items-center rounded-xl p-1 ${
          tone === "neutral" ? "text-[#94a3b8]" : "text-white"
        }`}
      >
        {graded && verdict !== "correct" ? (
          <XSmallIcon className="size-4" />
        ) : (
          <CheckSmallIcon className="size-4" />
        )}
      </motion.span>
      <span
        className={`text-sm leading-5 font-semibold break-words ${labelClasses}`}
      >
        {option.label}
      </span>
    </motion.button>
  );
}

function verdictFor(
  feedback: WorkshopAnswerFeedback | null,
  optionId: string,
): OptionVerdict {
  if (!feedback) return "neutral";
  if (optionId === feedback.correctOptionId) return "correct";
  if (optionId === feedback.chosenOptionId && !feedback.isCorrect) return "wrong";
  return "neutral";
}

function SubmitDock({
  canGoBack,
  isLast,
  answered,
  complete,
  submitting,
  onPrevious,
  onNext,
  onSubmit,
}: {
  canGoBack: boolean;
  isLast: boolean;
  answered: boolean;
  complete: boolean;
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const disabled = isLast ? !complete || submitting : !answered;

  return (
    <div className="absolute inset-x-0 bottom-0 z-[5] flex flex-col gap-3 rounded-t-[30px] bg-[#f8fafc] px-[18px] py-5">
      <div className="flex gap-3">
        {canGoBack ? (
          <motion.button
            type="button"
            onClick={onPrevious}
            whileTap={{ scale: 0.98 }}
            transition={PRESS}
            className="rounded-[20px] bg-primary-100 px-3.5 py-2 text-sm leading-5 font-semibold text-primary-500"
          >
            Sebelumnya
          </motion.button>
        ) : null}
        <motion.button
          type="button"
          onClick={isLast ? onSubmit : onNext}
          disabled={disabled}
          aria-busy={submitting}
          whileTap={disabled ? undefined : { scale: 0.98 }}
          transition={PRESS}
          className="flex flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-[#f8fafc] disabled:opacity-50"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={submitting ? "pending" : isLast ? "submit" : "next"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={LABEL_SWAP}
            >
              {submitting
                ? "Mengirim…"
                : isLast
                  ? "Submit Answer"
                  : "Soal Selanjutnya"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
      <p className="text-center text-xs leading-[1.25] text-[#64748b]">
        {isLast && !complete
          ? "Jawab semua soal dulu sebelum mengirim"
          : "Pilih satu jawaban yang benar"}
      </p>
    </div>
  );
}

function FeedbackSheet({
  feedback,
  isLast,
  onNext,
}: {
  feedback: WorkshopAnswerFeedback | null;
  isLast: boolean;
  onNext: () => void;
}) {
  return (
    <AnimatePresence>
      {feedback ? (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            className="pointer-events-none absolute inset-0 z-[6] bg-black/30"
          />
          <motion.div
            key="sheet"
            role="region"
            aria-live="polite"
            aria-label="Pembahasan"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={QUESTION_SPRING}
            className="absolute inset-x-0 bottom-0 z-[7] flex max-h-[70%] flex-col items-center gap-[30px] overflow-y-auto rounded-t-[30px] bg-[#f8fafc] px-[18px] py-5"
          >
            <span
              aria-hidden="true"
              className="h-1 w-[45px] shrink-0 rounded-[23px] bg-[#cbd5e1]"
            />
            <div className="flex w-full flex-col gap-6">
              <div className="flex flex-col gap-3 leading-[1.25]">
                <p
                  className={`text-sm font-bold ${
                    feedback.isCorrect ? "text-success" : "text-[#e71e43]"
                  }`}
                >
                  {feedback.isCorrect ? "Jawaban kamu benar!" : "Belum tepat"}
                </p>
                {feedback.explanation ? (
                  <p className="text-xs break-words text-[#64748b]">
                    {feedback.explanation}
                  </p>
                ) : null}
              </div>
              <motion.button
                type="button"
                onClick={onNext}
                whileTap={{ scale: 0.98 }}
                transition={PRESS}
                className="w-full rounded-[20px] bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-[#f8fafc]"
              >
                {isLast ? "Lihat Hasil" : "Soal Selanjutnya"}
              </motion.button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

const DOTS = [
  { cls: "size-1.5 bg-primary-500", style: { left: 114, top: 16 } },
  { cls: "size-1.5 bg-primary-500", style: { left: 14, top: 29 } },
  { cls: "size-1.5 bg-primary-500", style: { left: 120, top: 79 } },
  { cls: "size-3 bg-primary-100", style: { left: 2, top: 57 } },
  { cls: "size-3 bg-primary-100", style: { left: 131, top: 42 } },
  { cls: "size-3 bg-primary-100", style: { left: 0, top: 0 } },
] as const;

function WorkshopResultModal({
  result,
  onNext,
  onRetry,
}: {
  result: WorkshopAttemptResult | null;
  onNext: () => void;
  onRetry: () => void;
}) {
  if (!result) return null;

  const wrong = Math.max(result.totalItems - result.correctCount, 0);

  return (
    <AnimatePresence>
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
          aria-labelledby="workshop-quiz-result-title"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={MODAL_SPRING}
          className="absolute inset-x-[30px] top-[149px] z-20 flex max-h-[calc(100%-180px)] flex-col items-center gap-6 overflow-y-auto rounded-[20px] bg-[#f8fafc] p-5"
        >
          <div
            className="relative h-[85px] w-[143px] shrink-0"
            aria-hidden="true"
          >
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

          <div className="flex w-full flex-col items-center gap-2 text-center">
            <h2
              id="workshop-quiz-result-title"
              className="text-xl leading-[1.25] font-bold text-[#0f172a]"
            >
              Quiz Selesai
            </h2>
            <p className="text-sm leading-[1.25] text-[#64748b]">
              {result.isPassed
                ? "Kerja bagus! Kamu telah menyelesaikan seluruh pertanyaan. Yuk, lihat hasilnya."
                : "Kamu sudah menyelesaikan seluruh pertanyaan. Belum lulus kali ini — yuk, coba lagi."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-[20px] border border-[#cbd5e1] bg-[#f1f5f9] p-5">
              <p className="text-xs leading-[1.25] font-bold text-[#0f172a]">
                Hasil Pengerjaanmu
              </p>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded bg-primary-100">
                  <motion.div
                    className="h-full origin-left rounded bg-primary-500"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: result.score / 100 }}
                    transition={{ ...SCORE_SPRING, delay: 0.18 }}
                  />
                </div>
                <span className="text-sm leading-[1.25] font-bold text-primary-500">
                  {result.score}
                </span>
              </div>
              <p className="text-xs leading-[1.25] text-[#64748b]">
                {result.correctCount}/{result.totalItems} jawaban benar
              </p>
            </div>

            <div className="flex gap-3">
              <ScoreTile value={result.correctCount} label="Jawaban Benar" />
              <ScoreTile value={wrong} label="Jawaban Salah" />
            </div>
          </div>

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
    </AnimatePresence>
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
