"use client";

import { motion } from "motion/react";
import { ChevronRightIcon, SparklesIcon } from "@/shared/presentation/icons";
import type { DueReview } from "../domain/learning-space";
import { PRESS } from "./motion-tokens";

/**
 * Spaced-repetition reviews that are due now. Renders nothing when the queue
 * is empty — an empty "review" box on every visit would be noise.
 */
export function DueReviews({
  reviews,
  onOpen,
}: {
  reviews: DueReview[];
  onOpen: (review: DueReview) => void;
}) {
  if (reviews.length === 0) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
      aria-labelledby="due-reviews-title"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2
          id="due-reviews-title"
          className="text-[15px] font-bold text-secondary-500"
        >
          Waktunya Mengulas
        </h2>
        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-500">
          {reviews.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {reviews.slice(0, 3).map((review) => (
          <li key={review.reviewId}>
            <motion.button
              type="button"
              onClick={() => onOpen(review)}
              whileTap={{ scale: 0.99 }}
              transition={PRESS}
              className="flex w-full items-center gap-3 rounded-2xl border border-primary-100 bg-[#f5f7ff] p-3 text-left"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-primary-500 text-white">
                <SparklesIcon className="size-[18px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-[#101010]">
                  {review.lessonTitle || review.activityTitle}
                </span>
                <span className="truncate text-xs text-subtle">
                  {review.spaceTitle}
                </span>
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-[#c2c2c2]" />
            </motion.button>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
