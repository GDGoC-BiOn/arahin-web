"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * `reducedMotion="user"` drops transform animations for anyone who asked for
 * less motion but keeps opacity crossfades, so transitions soften rather than
 * turning into teleports.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
