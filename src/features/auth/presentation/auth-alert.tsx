"use client";

import { AnimatePresence, motion } from "motion/react";
import { ALERT_SPRING } from "./motion-tokens";

/**
 * A failed sign-in must not appear out of nowhere above the fields and shove
 * them down. The alert animates its own height and opacity so the form
 * reflows in one continuous movement.
 */
export function AuthAlert({ message }: { message: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.div
          key="auth-alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={ALERT_SPRING}
          className="w-full overflow-hidden"
        >
          <p
            role="alert"
            className="rounded-2xl bg-red-50 px-3.5 py-3 text-xs leading-5 font-semibold text-red-700"
          >
            {message}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
