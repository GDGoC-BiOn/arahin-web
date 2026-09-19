"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, useTransition } from "react";
import type { AuthUseCases } from "../application/auth-use-cases";
import { LABEL_SWAP, PRESS } from "./motion-tokens";

export function LogoutButton({
  useCases,
  onSignedOut,
}: {
  useCases: AuthUseCases;
  onSignedOut: () => void;
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const pending = signingOut || isNavigating;

  const signOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    // The cookie is cleared server-side whether or not the backend call
    // succeeds, so there is no failure path that should keep the user here.
    await useCases.signOut().catch(() => undefined);
    startNavigation(() => {
      onSignedOut();
    });
  }, [onSignedOut, signingOut, useCases]);

  return (
    <motion.button
      type="button"
      onClick={() => void signOut()}
      disabled={pending}
      aria-busy={pending}
      whileTap={pending ? undefined : { scale: 0.98 }}
      transition={PRESS}
      className="flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl border border-hairline bg-white text-sm font-bold text-secondary-500 shadow-[inset_0px_-3px_6px_0px_rgba(244,245,250,0.6)] transition-colors duration-150 ease-out disabled:opacity-60 can-hover:hover:bg-canvas/60"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={pending ? "pending" : "idle"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={LABEL_SWAP}
        >
          {pending ? "Sedang keluar…" : "Keluar"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
