"use client";

import { AnimatePresence, motion } from "motion/react";
import { BrainIcon, CheckSmallIcon } from "@/shared/presentation/icons";
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
  onLeave,
}: {
  percent: number | null;
  caption: string;
  steps: IngestionStep[];
  fileName: string | null;
  lessonProgress: string | null;
  onLeave?: () => void;
}) {
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

      {percent === null ? (
        <p role="status" className="text-sm font-semibold text-primary-500">
          {lessonProgress ?? "Menunggu materi pertama selesai…"}
        </p>
      ) : (
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
      )}
      {onLeave ? (
        <button
          type="button"
          onClick={onLeave}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-500"
        >
          Kembali ke Beranda · lanjut di background
        </button>
      ) : null}

      {percent !== null ? (
        <ol className="flex w-full flex-col gap-4">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ol>
      ) : null}
    </motion.div>
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
