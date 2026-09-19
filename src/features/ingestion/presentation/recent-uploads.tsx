"use client";

import { motion } from "motion/react";
import { ChevronRightIcon, FileBadgeIcon } from "@/shared/presentation/icons";
import type { SpaceProgress, SpaceSummary } from "../domain/learning-space";
import { PRESS, PROGRESS_SPRING } from "./motion-tokens";

export type RecentUpload = {
  id: string;
  title: string;
  formatLabel: string;
  relativeTime: string;
  progressPercent: number;
};

/** The three tints the design uses, cycled by position. */
const TINTS = [
  { badge: "bg-[#eef3ff]", glyph: "text-[#e8395b]", label: "text-[#e8395b]" },
  {
    badge: "bg-[#f0fcf4]",
    glyph: "text-primary-500",
    label: "text-primary-500",
  },
  { badge: "bg-[#fff7ed]", glyph: "text-[#f59e0b]", label: "text-[#f59e0b]" },
] as const;

export function RecentUploads({
  uploads,
  onOpen,
  onSeeAll,
  query = "",
}: {
  query?: string;
  uploads: RecentUpload[];
  onOpen: (id: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <section
      aria-labelledby="recent-uploads-title"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2
          id="recent-uploads-title"
          className="text-[15px] font-bold text-secondary-500"
        >
          {query ? "Hasil Pencarian" : "Unggahan Terbaru"}
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold text-primary-500"
        >
          Lihat semua
        </button>
      </div>

      {uploads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stroke px-4 py-6 text-center text-[13px] text-muted">
          {query
            ? `Tidak ada dokumen yang cocok dengan “${query}”.`
            : "Belum ada dokumen. Unggah satu untuk mulai belajar."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {uploads.map((upload, index) => {
            const tint = TINTS[index % TINTS.length] ?? TINTS[0];
            return (
              <li key={upload.id}>
                <motion.button
                  type="button"
                  onClick={() => onOpen(upload.id)}
                  whileTap={{ scale: 0.99 }}
                  transition={PRESS}
                  className="flex w-full items-center gap-3 rounded-2xl border-[1.769px] border-[#f0f0f0] bg-white p-3 text-left"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] ${tint.badge} ${tint.glyph}`}
                  >
                    <FileBadgeIcon className="size-[18px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm font-semibold text-[#101010]">
                      {upload.title}
                    </span>
                    <span className="flex items-center gap-2 pt-1 text-xs">
                      <span className={`font-semibold ${tint.label}`}>
                        {upload.formatLabel}
                      </span>
                      <span className="text-subtle">
                        · {upload.relativeTime}
                      </span>
                    </span>
                    <span className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
                      <motion.span
                        className="block h-full origin-left rounded-full bg-primary-500"
                        initial={false}
                        animate={{ scaleX: upload.progressPercent / 100 }}
                        transition={PROGRESS_SPRING}
                      />
                    </span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-[#c2c2c2]" />
                </motion.button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const RELATIVE = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

/** The backend formats createdAt as "YYYY-MM-DDTHH:MM:SSZ", not RFC3339. */
export function relativeTime(createdAt: string, now = Date.now()): string {
  const parsed = Date.parse(createdAt);
  if (Number.isNaN(parsed)) return "baru saja";
  const diffMinutes = Math.round((parsed - now) / 60_000);
  if (Math.abs(diffMinutes) < 60) return RELATIVE.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return RELATIVE.format(diffHours, "hour");
  return RELATIVE.format(Math.round(diffHours / 24), "day");
}

export function toRecentUploads(
  spaces: SpaceSummary[],
  progress: SpaceProgress[],
  now = Date.now(),
): RecentUpload[] {
  const byId = new Map(progress.map((entry) => [entry.id, entry]));
  // A space with no tracks is an upload that failed or never finished; the
  // backend has no delete, so hide it rather than list an empty card.
  return spaces
    .filter((space) => space.hasTracks)
    .map((space) => ({
      id: space.id,
      title: space.title,
      // sourceType is "" until a blueprint exists; show something honest.
      formatLabel: (space.sourceType || "file").toUpperCase(),
      relativeTime: relativeTime(space.createdAt, now),
      progressPercent: byId.get(space.id)?.progressPercent ?? 0,
    }));
}
