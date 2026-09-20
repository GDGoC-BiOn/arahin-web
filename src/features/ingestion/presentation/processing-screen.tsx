"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { parseLessonContent } from "@/features/reader/domain/lesson-content";
import { LessonBody } from "@/features/reader/presentation/lesson-body";
import { BrainIcon, CheckSmallIcon } from "@/shared/presentation/icons";
import type { GenerationLessonTask } from "../domain/generation-job";
import type { IngestionStep } from "../domain/ingestion-progress";
import { FADE, PROGRESS_SPRING, STEP_SPRING } from "./motion-tokens";

/**
 * The percentage here is built from real phase boundaries and real upload
 * bytes (see domain/ingestion-progress). Within the two blocking server
 * phases it eases toward — never onto — that phase's ceiling, so the number
 * conveys "still working" without ever claiming progress it has not earned.
 */
export function ProcessingScreen({
  percent,
  caption,
  steps,
  fileName,
  lessonProgress,
  lessons,
}: {
  percent: number;
  caption: string;
  steps: IngestionStep[];
  fileName: string | null;
  lessonProgress: string | null;
  lessons: GenerationLessonTask[];
}) {
  const [selected, setSelected] = useState<GenerationLessonTask | null>(null);
  const previewSections = useMemo(
    () => parseLessonContent(selected?.contentMarkdown ?? ""),
    [selected],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={FADE}
      className="flex flex-1 flex-col items-center justify-center gap-8 px-6"
    >
      <PulsingBrain />

      <div className="flex flex-col items-center gap-1.5">
        <h1 className="text-xl font-bold text-ink">AI sedang memproses</h1>
        {/* The caption names the phase, so the wait is legible even while the
            number is easing rather than stepping. */}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p
            key={caption}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={FADE}
            className="text-center text-xs text-subtle"
          >
            {caption}
          </motion.p>
        </AnimatePresence>
        {fileName ? (
          <p className="max-w-[280px] truncate text-center text-xs text-muted">
            {fileName}
          </p>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f0]"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres pemrosesan"
        >
          <motion.div
            className="h-full origin-left rounded-full bg-primary-500"
            initial={false}
            animate={{ scaleX: percent / 100 }}
            transition={PROGRESS_SPRING}
          />
        </div>
        <p className="self-end pt-2 text-xs text-subtle">{percent}%</p>
      </div>

      {lessons.length > 0 ? (
        <LessonGenerationStepper
          lessons={lessons}
          label={lessonProgress}
          onOpen={setSelected}
        />
      ) : (
        <ol className="flex w-full flex-col gap-4">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ol>
      )}

      <AnimatePresence>
        {selected?.contentMarkdown ? (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-[#f8fafc] p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={FADE}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mb-4 self-start rounded-xl px-3 py-2 text-sm font-semibold text-primary-500"
            >
              Kembali ke proses
            </button>
            <h2 className="mb-4 text-xl font-bold text-ink">
              {selected.title || "Materi"}
            </h2>
            <LessonBody sections={previewSections} />
            <p className="mt-4 text-xs text-subtle">
              Preview materi. Kuis tersedia setelah seluruh generation selesai.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function LessonGenerationStepper({
  lessons,
  label,
  onOpen,
}: {
  lessons: GenerationLessonTask[];
  label: string | null;
  onOpen: (lesson: GenerationLessonTask) => void;
}) {
  const ordered = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
  return (
    <div className="flex w-full flex-col gap-3">
      {label ? (
        <p className="text-sm font-semibold text-primary-500">{label}</p>
      ) : null}
      <ol className="flex max-h-56 w-full flex-col gap-2 overflow-y-auto pr-1">
        {ordered.map((lesson) => {
          const completed =
            lesson.status === "completed" && Boolean(lesson.contentMarkdown);
          const active =
            lesson.status === "running" ||
            lesson.status === "retryable_failed";
          return (
            <li key={lesson.conceptId}>
              <button
                type="button"
                disabled={!completed}
                onClick={() => onOpen(lesson)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-left disabled:cursor-default"
              >
                <span
                  className={
                    "flex size-6 shrink-0 items-center justify-center rounded-full " +
                    (completed
                      ? "bg-[#31c277] text-white"
                      : active
                        ? "bg-[#eaf0fc] text-primary-500"
                        : "bg-[#f1f5f9] text-[#94a3b8]")
                  }
                >
                  {completed ? (
                    <CheckSmallIcon className="size-[13px]" />
                  ) : (
                    <span
                      className={
                        "block rounded-full " +
                        (active
                          ? "size-2.5 bg-primary-500"
                          : "size-2 bg-[#cbd5e1]")
                      }
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-ink">
                    Sesi {lesson.orderIndex}
                  </span>
                  <span className="block truncate text-xs text-subtle">
                    {lesson.title ||
                      (active ? "Sedang dibuat…" : "Menunggu giliran…")}
                  </span>
                </span>
                {completed ? (
                  <span className="text-xs font-semibold text-primary-500">
                    Buka
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepRow({ step }: { step: IngestionStep }) {
  const done = step.status === "done";
  const active = step.status === "active";
  return (
    <li className="flex items-center gap-3">
      <motion.span
        initial={false}
        animate={{ scale: active ? 1.06 : 1 }}
        transition={STEP_SPRING}
        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
          done
            ? "bg-[#31c277] text-white"
            : active
              ? "bg-[#eaf0fc]"
              : "bg-[#f5f5f5]"
        }`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {done ? (
            <motion.span
              key="check"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={STEP_SPRING}
            >
              <CheckSmallIcon className="size-[13px]" />
            </motion.span>
          ) : (
            <motion.span
              key="dot"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={STEP_SPRING}
              className={`block rounded-full ${
                active ? "size-2.5 bg-primary-500/90" : "size-2 bg-[#cbd5e1]"
              }`}
            />
          )}
        </AnimatePresence>
      </motion.span>
      <motion.span
        initial={false}
        animate={{ opacity: step.status === "pending" ? 0.55 : 1 }}
        transition={FADE}
        className={`text-sm ${
          done
            ? "font-semibold text-[#31c277]"
            : active
              ? "font-semibold text-primary-500"
              : "text-subtle"
        }`}
      >
        {step.label}
      </motion.span>
    </li>
  );
}

/**
 * A slow breathing halo. This is the one piece of decorative motion on the
 * screen, and it earns its place: during a wait of up to three minutes with no
 * server-side progress to report, it is what distinguishes "working" from
 * "frozen".
 */
function PulsingBrain() {
  return (
    <div className="relative flex size-28 items-center justify-center">
      <motion.span
        className="absolute -inset-[8.79px] rounded-full bg-primary-600/15 opacity-85"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.35, 0.7] }}
        transition={{
          duration: 2.4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <span className="absolute inset-2 rounded-full bg-primary-600/20 opacity-50" />
      <span className="relative flex size-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2a63e2_0%,#4f8ef7_100%)] text-white">
        <BrainIcon className="size-7" />
      </span>
    </div>
  );
}
