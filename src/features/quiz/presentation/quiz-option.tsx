"use client";

import { motion } from "motion/react";
import { CheckSmallIcon, XSmallIcon } from "@/shared/presentation/icons";
import type { QuizOption as Option } from "../domain/quiz";
import type { OptionVerdict } from "../domain/quiz-review";
import { OPTION_STAGGER, OPTION_TINT, QUESTION_SPRING } from "./motion-tokens";

const CHIP: Record<OptionVerdict | "selected", string> = {
  selected: "#3d6bec",
  correct: "#1f8851",
  wrong: "#e71e43",
  neutral: "#e2e8f0",
};

/**
 * The colour change is the only confirmation a tap registered, so it is the
 * one thing here that must never be skipped. Once graded (`verdict` set) the
 * option is read-only and shows right/wrong instead of the selection.
 */
export function QuizOption({
  option,
  selected,
  index,
  verdict,
  onSelect,
}: {
  option: Option;
  selected: boolean;
  index: number;
  verdict: OptionVerdict | null;
  onSelect: (optionId: string) => void;
}) {
  const graded = verdict !== null;
  const tone = graded ? verdict : selected ? "selected" : "neutral";

  return (
    <motion.button
      type="button"
      onClick={graded ? undefined : () => onSelect(option.id)}
      aria-pressed={graded ? undefined : selected}
      aria-disabled={graded || undefined}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...QUESTION_SPRING, delay: index * OPTION_STAGGER }}
      whileTap={graded ? undefined : { scale: 0.99 }}
      className={`flex w-full items-center gap-2 overflow-hidden rounded-[20px] border py-2 pr-3.5 pl-2.5 text-left shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] transition-colors duration-150 ease-out ${
        {
          selected: "border-primary-300 bg-primary-100",
          correct: "border-[#3ae18b] bg-success-soft",
          wrong: "border-[#f9a3b1] bg-[#fddadc]",
          neutral: "border-[#cbd5e1] bg-[#f1f5f9]",
        }[tone]
      } ${graded ? "cursor-default" : ""}`}
    >
      <motion.span
        initial={false}
        animate={{ backgroundColor: CHIP[tone] }}
        transition={OPTION_TINT}
        className={`flex shrink-0 items-center rounded-xl p-1 ${
          tone === "neutral" ? "text-[#94a3b8]" : "text-white"
        }`}
      >
        {graded && verdict !== "correct" ? (
          <XSmallIcon className="size-4" />
        ) : (
          <CheckSmallIcon className="size-4" />
        )}
      </motion.span>
      <span
        className={`text-sm leading-5 font-semibold break-words ${
          {
            selected: "text-primary-500",
            correct: "text-success",
            wrong: "text-[#e71e43]",
            neutral: "text-subtle",
          }[tone]
        }`}
      >
        {option.label}
      </span>
    </motion.button>
  );
}
