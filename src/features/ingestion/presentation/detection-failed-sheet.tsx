"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import {
  ReasonFileIcon,
  ReasonFormatIcon,
  ReasonImageIcon,
  XCircleIcon,
} from "@/shared/presentation/icons";
import { FADE, PRESS, SHEET_SPRING } from "./motion-tokens";
import type { IngestionFailure } from "./use-ingestion-flow";

const REASONS = [
  {
    id: "corrupt",
    Icon: ReasonFileIcon,
    label: "File mungkin rusak atau terenkripsi",
  },
  {
    id: "no-text",
    Icon: ReasonImageIcon,
    label: "Tidak ada teks yang dapat dibaca AI",
  },
  {
    id: "format",
    Icon: ReasonFormatIcon,
    label: "Format tidak didukung untuk analisis",
  },
] as const;

/**
 * Rises from the bottom edge and leaves by the same edge, so the sheet has one
 * consistent spatial story. The scrim fades rather than cutting, because the
 * home screen stays visible behind it.
 */
export function DetectionFailedSheet({
  failure,
  canRetry,
  onRetry,
  onHome,
  onSignIn,
}: {
  failure: IngestionFailure | null;
  canRetry: boolean;
  onRetry: () => void;
  onHome: () => void;
  onSignIn: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  // Move focus into the sheet when it opens; a dialog the keyboard cannot
  // reach is not usable.
  useEffect(() => {
    if (failure) panel.current?.focus();
  }, [failure]);

  return (
    <AnimatePresence>
      {failure ? (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            onClick={onHome}
            className="absolute inset-0 z-10 bg-[#1a1c1e]/45"
          />
          <motion.div
            key="sheet"
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detection-failed-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SHEET_SPRING}
            // Capped and scrollable: the backend's own reason can add lines the
            // design never budgeted for, and the actions must stay reachable.
            className="absolute inset-x-0 bottom-0 z-20 flex max-h-full flex-col items-center gap-4 overflow-y-auto rounded-t-[28px] bg-white px-6 pt-3 pb-6 outline-none"
          >
            <span
              aria-hidden="true"
              className="h-1 w-[45px] rounded-[23px] bg-[#cbd5e1]"
            />

            <span className="relative flex size-20 shrink-0 items-center justify-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-[#feedee]"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{
                  duration: 2.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-[#fddadc] text-[#e71e43]">
                <XCircleIcon className="size-8" />
              </span>
            </span>

            <div className="flex flex-col items-center gap-2">
              <h2
                id="detection-failed-title"
                className="text-xl font-bold text-[#101010]"
              >
                {failure.title}
              </h2>
              <p
                role="alert"
                className="text-center text-xs leading-[1.25] text-subtle"
              >
                {failure.message}
              </p>
            </div>

            {failure.showReasons ? (
              <ul className="flex w-full flex-col gap-2.5">
                {REASONS.map(({ id, Icon, label }) => (
                  <li
                    key={id}
                    className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f1f5f9] px-4 py-3"
                  >
                    <Icon className="size-4 shrink-0 text-primary-500" />
                    <span className="text-xs font-semibold text-primary-500">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex w-full flex-col gap-3">
              <motion.button
                type="button"
                onClick={failure.kind === "session" ? onSignIn : onRetry}
                whileTap={{ scale: 0.98 }}
                transition={PRESS}
                className="w-full rounded-[20px] bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-white"
              >
                {failure.kind === "session"
                  ? "Masuk Lagi"
                  : failure.kind === "service" && canRetry
                    ? "Coba Lagi"
                    : "Coba File Lain"}
              </motion.button>
              <motion.button
                type="button"
                onClick={onHome}
                whileTap={{ scale: 0.98 }}
                transition={PRESS}
                className="w-full rounded-[20px] bg-[#d9defb] px-3.5 py-2 text-sm leading-5 font-semibold text-primary-500"
              >
                Kembali ke Beranda
              </motion.button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
