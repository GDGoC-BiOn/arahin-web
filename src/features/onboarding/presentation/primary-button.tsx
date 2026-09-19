"use client";

import { AnimatePresence, motion } from "motion/react";
import { LABEL_SWAP, PRESS } from "./motion-tokens";

function PendingDots() {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {["one", "two", "three"].map((dot, position) => (
        <motion.span
          key={dot}
          className="block size-1.5 rounded-full bg-white"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 0.9,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: position * 0.12,
          }}
        />
      ))}
    </span>
  );
}

export function PrimaryButton({
  label,
  pending,
  pendingLabel,
  onActivate,
}: {
  label: string;
  pending: boolean;
  pendingLabel: string;
  onActivate: () => void;
}) {
  // The button stays full-width, so swapping "Lanjut" for the longer
  // "Mulai Sekarang" crossfades in place without reflowing anything.
  return (
    <motion.button
      type="button"
      onClick={onActivate}
      disabled={pending}
      aria-busy={pending}
      whileTap={pending ? undefined : { scale: 0.97 }}
      transition={PRESS}
      className="relative flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary-500 px-2 py-4 text-base font-semibold text-white disabled:cursor-wait can-hover:hover:bg-primary-600"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={pending ? "__pending" : label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={LABEL_SWAP}
          className="flex items-center gap-2 leading-[1.25]"
        >
          {pending ? <PendingDots /> : label}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">{pending ? pendingLabel : ""}</span>
    </motion.button>
  );
}
