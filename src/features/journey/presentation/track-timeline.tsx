"use client";

import { motion } from "motion/react";
import { ArrowLeftSmallIcon } from "@/shared/presentation/icons";
import type { TimelineSession, TimelineTrack } from "../domain/session";
import { railProgress } from "../domain/timeline";
import { PRESS, RAIL_SPRING } from "./motion-tokens";

/** Vertical distance between node centres, from the design (218 -> 348 -> …). */
const NODE_SPACING = 130;

export function TrackHeader({
  track,
  onBack,
}: {
  track: TimelineTrack;
  onBack: () => void;
}) {
  return (
    <header className="flex flex-col gap-3 rounded-b-[40px] bg-primary-500 px-6 py-4">
      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          onClick={onBack}
          aria-label="Kembali"
          whileTap={{ scale: 0.92 }}
          transition={PRESS}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-white"
        >
          <ArrowLeftSmallIcon className="size-4" />
        </motion.button>
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-xl leading-[1.25] font-bold text-white">
            {track.title}
          </p>
          <p className="truncate text-xs leading-[1.25] text-[#f8fafc]">
            {track.subtitle}
            {track.mastery ? ` · Penguasaan ${track.mastery}%` : null}
          </p>
        </div>
      </div>

      <div className="pt-3">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-white/30"
          role="progressbar"
          aria-valuenow={track.completedCount}
          aria-valuemin={0}
          aria-valuemax={track.totalCount}
          aria-label="Sesi selesai"
        >
          <motion.div
            className="h-full origin-left rounded-full bg-white"
            initial={false}
            animate={{ scaleX: track.progress }}
            transition={RAIL_SPRING}
          />
        </div>
      </div>

      <p className="text-xs leading-[1.25] text-[#f8fafc]">
        {track.completedCount}/{track.totalCount} sesi selesai
      </p>
    </header>
  );
}

export function SessionRail({
  track,
  children,
}: {
  track: TimelineTrack;
  children: React.ReactNode;
}) {
  const filled = railProgress(track);
  // The rail spans between the first and last node centres, so it never
  // overshoots past the ends of the list.
  const railHeight = Math.max(track.sessions.length - 1, 0) * NODE_SPACING;

  return (
    <div className="relative px-6 pt-8 pb-10">
      {track.sessions.length > 1 ? (
        <div
          aria-hidden="true"
          className="absolute left-1/2 w-1 -translate-x-1/2 rounded-full bg-[#eaedfd]"
          style={{ top: 32 + 32, height: railHeight }}
        >
          <motion.div
            className="w-full origin-top rounded-full bg-primary-500"
            initial={false}
            animate={{ scaleY: filled }}
            transition={RAIL_SPRING}
            style={{ height: railHeight }}
          />
        </div>
      ) : null}

      <ol
        className="relative flex flex-col"
        style={{ gap: NODE_SPACING - 64 }}
        aria-label="Daftar sesi"
      >
        {children}
      </ol>
    </div>
  );
}

export type { TimelineSession, TimelineTrack };
