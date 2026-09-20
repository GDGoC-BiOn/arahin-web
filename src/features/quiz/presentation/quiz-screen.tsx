"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useReducer, useState } from "react";
import { ArrowLeftSmallIcon } from "@/shared/presentation/icons";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import type { QuizUseCases } from "../application/quiz-use-cases";
import type {
  AnswerFeedback,
  AttemptResult,
  QuizDetail,
  QuizSource,
} from "../domain/quiz";
import {
  citationLabels,
  feedbackFor,
  feedbackTitle,
  hasReview,
  optionVerdict,
} from "../domain/quiz-review";
import {
  answerFor,
  goNext,
  goPrevious,
  INITIAL_QUIZ_SESSION,
  isComplete,
  isSessionExpired,
  type QuizDirection,
  type QuizSession,
  selectOption,
} from "../domain/quiz-session";
import {
  FADE,
  LABEL_SWAP,
  PRESS,
  QUESTION_OFFSET,
  QUESTION_SPRING,
} from "./motion-tokens";
import { QuizOption } from "./quiz-option";
import { QuizResultModal } from "./quiz-result-modal";

type Action =
  | { type: "select"; itemId: string; optionId: string }
  | { type: "next"; count: number }
  | { type: "previous" }
  | { type: "review" }
  | { type: "restart" };

function reducer(state: QuizSession, action: Action): QuizSession {
  switch (action.type) {
    case "select":
      return selectOption(state, action.itemId, action.optionId);
    case "next":
      return goNext(state, action.count);
    case "previous":
      return goPrevious(state);
    case "review":
      // Walk the graded quiz from the top, keeping the answers on screen.
      return { ...state, index: 0, direction: 1 };
    case "restart":
      return INITIAL_QUIZ_SESSION;
  }
}

/** Enter and exit travel the same axis, so the swap is never an empty frame. */
const variants = {
  enter: (direction: QuizDirection) => ({
    x: direction * QUESTION_OFFSET,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: QuizDirection) => ({
    x: direction * -QUESTION_OFFSET,
    opacity: 0,
  }),
};

export function QuizScreen({
  useCases,
  source,
  initialQuiz,
  lessonId,
  spaceId,
  onBack,
  onFinish,
  onSignIn,
}: {
  useCases: QuizUseCases;
  source: QuizSource;
  /** Activities arrive with their items already; only legacy quizzes load. */
  initialQuiz: QuizDetail | null;
  lessonId: string;
  spaceId: string | null;
  onBack: () => void;
  onFinish: () => void;
  onSignIn: () => void;
}) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(initialQuiz);
  const [error, setError] = useState<string | null>(null);
  const [session, dispatch] = useReducer(reducer, INITIAL_QUIZ_SESSION);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (source.kind !== "quiz") return;
    let cancelled = false;
    useCases
      .loadQuiz(source.quizId)
      .then((loaded) => {
        if (!cancelled) setQuiz(loaded);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat kuis. Coba lagi.");
      });
    return () => {
      cancelled = true;
    };
  }, [source, useCases]);

  const items = quiz?.items ?? [];
  const item = items[session.index] ?? null;
  const complete = isComplete(session, items);
  const feedback = reviewing && item ? feedbackFor(result, item.id) : null;

  const submit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Held true until the modal is on screen, so the gap between tap and
      // result is never a dead frame.
      const graded = await useCases.submit({
        source,
        session,
        items: quiz.items,
        spaceId,
        lessonId,
      });
      setResult(graded);
      // Per-question feedback first, then the score. The backend grades the
      // whole quiz at once, so the walkthrough starts after submitting.
      if (hasReview(graded)) {
        dispatch({ type: "review" });
        setReviewing(true);
      } else {
        setShowResult(true);
      }
    } catch (caught) {
      if (isSessionExpired(caught)) {
        setExpired(true);
        setError(
          "Sesi kamu sudah berakhir. Masuk lagi untuk mengirim jawaban.",
        );
      } else {
        setError("Gagal mengirim jawaban. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [lessonId, quiz, session, source, spaceId, submitting, useCases]);

  return (
    <AppPanel surface="bg-[#f8fafc]">
      <main
        id="main"
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain ${reviewing ? "pb-80" : "pb-40"}`}
      >
        <header className="relative flex min-h-[293px] shrink-0 flex-col overflow-hidden rounded-b-[40px] bg-primary-500 pb-10">
          {/* The soft glow from the design, purely decorative. */}
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
                aria-valuenow={session.index + 1}
                aria-valuemin={1}
                aria-valuemax={Math.max(items.length, 1)}
                aria-label="Kemajuan kuis"
              >
                <motion.div
                  className="h-full origin-left rounded bg-white"
                  initial={false}
                  animate={{
                    scaleX: items.length
                      ? (session.index + 1) / items.length
                      : 0,
                  }}
                  transition={QUESTION_SPRING}
                />
              </div>
              <span className="text-sm leading-[1.25] font-bold text-[#f8fafc]">
                {items.length ? session.index + 1 : 0}/{items.length}
              </span>
            </div>
          </div>

          <div className="relative mx-auto flex w-[294px] flex-col items-center gap-5 pt-[57px]">
            <span className="rounded-2xl bg-white px-2.5 py-0.5 text-xs leading-[18px] font-semibold text-[#146af7]">
              Quiz
            </span>
            <AnimatePresence
              initial={false}
              custom={session.direction}
              mode="popLayout"
            >
              <motion.h1
                key={item?.id ?? "loading"}
                custom={session.direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={QUESTION_SPRING}
                className="text-center text-base leading-[1.25] font-bold text-[#f8fafc]"
              >
                {item?.question ?? "Memuat soal…"}
              </motion.h1>
            </AnimatePresence>
          </div>
        </header>

        <div className="flex flex-col gap-3 px-[18px] pt-8">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={item?.id ?? "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="flex flex-col gap-3"
            >
              {item?.options.map((option, index) => (
                <QuizOption
                  key={option.id}
                  option={option}
                  index={index}
                  selected={answerFor(session, item.id) === option.id}
                  verdict={
                    reviewing ? optionVerdict(feedback, option.id) : null
                  }
                  onSelect={(optionId) =>
                    dispatch({ type: "select", itemId: item.id, optionId })
                  }
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {error ? (
            <p
              role="alert"
              className="pt-2 text-xs font-semibold text-[#e71e43]"
            >
              {error}
            </p>
          ) : null}
          {expired ? (
            <motion.button
              type="button"
              onClick={onSignIn}
              whileTap={{ scale: 0.98 }}
              transition={PRESS}
              className="self-start rounded-[20px] bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-white"
            >
              Masuk Lagi
            </motion.button>
          ) : null}
        </div>
      </main>

      {reviewing ? null : (
        <SubmitDock
          canGoBack={session.index > 0}
          isLast={items.length > 0 && session.index === items.length - 1}
          answered={item ? answerFor(session, item.id) !== null : false}
          complete={complete}
          submitting={submitting}
          onPrevious={() => dispatch({ type: "previous" })}
          onNext={() => dispatch({ type: "next", count: items.length })}
          onSubmit={() => void submit()}
        />
      )}

      <FeedbackSheet
        feedback={feedback}
        itemKey={item?.id ?? ""}
        isLast={items.length > 0 && session.index === items.length - 1}
        onNext={() => {
          if (session.index >= items.length - 1) {
            setReviewing(false);
            setShowResult(true);
          } else {
            dispatch({ type: "next", count: items.length });
          }
        }}
      />

      <QuizResultModal
        result={showResult ? result : null}
        onNext={onFinish}
        onRetry={() => {
          setResult(null);
          setShowResult(false);
          setReviewing(false);
          dispatch({ type: "restart" });
        }}
      />
    </AppPanel>
  );
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
  // Submitting is only offered on the last question, and only once every item
  // has an answer — the backend scores unanswered items as wrong.
  const showSubmit = isLast;
  const disabled = showSubmit ? !complete || submitting : !answered;

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
          onClick={showSubmit ? onSubmit : onNext}
          disabled={disabled}
          aria-busy={submitting}
          whileTap={disabled ? undefined : { scale: 0.98 }}
          transition={PRESS}
          className="flex flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-[#f8fafc] disabled:opacity-50"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={submitting ? "pending" : showSubmit ? "submit" : "next"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={LABEL_SWAP}
            >
              {submitting
                ? "Mengirim…"
                : showSubmit
                  ? "Submit Answer"
                  : "Soal Selanjutnya"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
      <p className="text-center text-xs leading-[1.25] text-[#64748b]">
        {showSubmit && !complete
          ? "Jawab semua soal dulu sebelum mengirim"
          : "Pilih satu jawaban yang benar"}
      </p>
    </div>
  );
}

/**
 * Rises from the bottom like the ingestion failure sheet. It stays mounted
 * across questions and only swaps its copy, so stepping through the review
 * never flashes an empty frame.
 */
function FeedbackSheet({
  feedback,
  itemKey,
  isLast,
  onNext,
}: {
  feedback: AnswerFeedback | null;
  itemKey: string;
  isLast: boolean;
  onNext: () => void;
}) {
  const labels = citationLabels(feedback?.citation);
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
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={itemKey}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={LABEL_SWAP}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-3 leading-[1.25]">
                    <p
                      className={`text-sm font-bold ${
                        feedback.isCorrect ? "text-success" : "text-[#e71e43]"
                      }`}
                    >
                      {feedbackTitle(feedback)}
                    </p>
                    {feedback.explanation ? (
                      <p className="text-xs break-words text-[#64748b]">
                        {feedback.explanation}
                      </p>
                    ) : null}
                  </div>
                  {labels.length ? (
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => (
                        <span
                          key={label}
                          className="rounded-2xl bg-primary-100 px-2.5 py-0.5 text-xs leading-[18px] font-semibold text-primary-500"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
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
