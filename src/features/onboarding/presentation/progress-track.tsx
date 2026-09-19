"use client";

import { motion } from "motion/react";
import { segmentState } from "../domain/onboarding-progress";
import { PROGRESS_SPRING } from "./motion-tokens";

export function ProgressTrack({
  slideIds,
  activeIndex,
}: {
  slideIds: readonly string[];
  activeIndex: number;
}) {
  return (
    <div aria-hidden="true" className="flex items-center gap-3">
      {slideIds.map((id, segment) => (
        <span
          key={id}
          className="h-[5px] flex-1 overflow-hidden rounded-[2px] bg-primary-600/30"
        >
          <motion.span
            className="block h-full w-full origin-left rounded-[2px] bg-primary-600"
            initial={false}
            animate={{
              scaleX: segmentState(segment, activeIndex) === "upcoming" ? 0 : 1,
            }}
            transition={PROGRESS_SPRING}
          />
        </span>
      ))}
    </div>
  );
}
