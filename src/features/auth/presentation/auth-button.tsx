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

/**
 * Figma "Button": 48px tall, 16px radius, primary blue with the stacked
 * ring/lift shadow.
 *
 * The Figma layer also carries a 1px white border, but sampling the rendered
 * frame shows white -> #3358F0 ring -> #3D6BEC fill with no white gap: the
 * border sits under the ring and never shows. Reproducing it literally adds a
 * halo the design does not have, so only the shadows are kept.
 */
export function AuthButton({
  label,
  pendingLabel,
  pending,
  disabled,
  type = "submit",
  onClick,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={pending || disabled}
      aria-busy={pending}
      whileTap={pending || disabled ? undefined : { scale: 0.98 }}
      transition={PRESS}
      className="flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-primary-500 px-6 text-sm font-semibold text-white shadow-[0px_1px_2px_0px_rgba(37,62,167,0.48),0px_0px_0px_1px_#375dfb] transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 can-hover:hover:bg-primary-600"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={pending ? "__pending" : label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={LABEL_SWAP}
          className="flex items-center leading-[1.25]"
        >
          {pending ? <PendingDots /> : label}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">{pending ? pendingLabel : ""}</span>
    </motion.button>
  );
}
