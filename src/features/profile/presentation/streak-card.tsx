"use client";

import { motion } from "motion/react";
import { CheckSmallIcon } from "@/shared/presentation/icons";
import { FlameSolidIcon } from "@/shared/presentation/icons/profile-icons";
import type { StreakDay } from "../domain/profile-summary";
import { STREAK_SPRING, STREAK_STAGGER } from "./motion-tokens";

/**
 * The circles are derived from a single `dailyStreak` integer — the backend
 * keeps no per-day history. A streak is an unbroken run ending today, so the
 * last N circles are filled. The screen-reader text states the number outright
 * rather than making someone count dots.
 */
export function StreakCard({
  days,
  dailyStreak,
}: {
  days: StreakDay[];
  dailyStreak: number;
}) {
  return (
    <section
      aria-labelledby="streak-title"
      className="flex flex-col gap-3 rounded-2xl bg-[linear-gradient(160deg,#fff7ed_0%,#fffbeb_100%)] p-4"
    >
      <h2
        id="streak-title"
        className="flex items-center gap-2 text-sm font-semibold text-ink"
      >
        <FlameSolidIcon className="size-[18px] text-amber" />
        Rentetan Belajar 7 Hari
      </h2>

      <ol className="flex items-start gap-2">
        {days.map((day, index) => (
          <li
            key={day.offset}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <motion.span
              initial={{ scale: 0.86, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                ...STREAK_SPRING,
                delay: index * STREAK_STAGGER,
              }}
              className={`flex size-8 items-center justify-center rounded-full ${
                day.active
                  ? "bg-amber text-white"
                  : "bg-amber/15 text-transparent"
              }`}
            >
              {day.active ? <CheckSmallIcon className="size-3.5" /> : null}
            </motion.span>
            <span className="text-xs text-subtle">{day.label}</span>
          </li>
        ))}
      </ol>

      <p className="sr-only">
        {dailyStreak > 0
          ? `Kamu belajar ${dailyStreak} hari berturut-turut.`
          : "Belum ada rentetan belajar."}
      </p>
    </section>
  );
}

export function StreakCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-[116px] flex-col gap-3 rounded-2xl bg-[linear-gradient(160deg,#fff7ed_0%,#fffbeb_100%)] p-4"
    >
      <span className="h-4 w-40 rounded bg-white/70" />
      <div className="flex gap-2">
        {["a", "b", "c", "d", "e", "f", "g"].map((key) => (
          <span key={key} className="size-8 flex-1 rounded-full bg-white/70" />
        ))}
      </div>
    </div>
  );
}
