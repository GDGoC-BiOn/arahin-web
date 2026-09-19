"use client";

import {
  DocumentStatIcon,
  FlameStatIcon,
  StarStatIcon,
  TrophyStatIcon,
} from "@/shared/presentation/icons/profile-icons";
import type { StatTile, StatTileId } from "../domain/profile-summary";

const ICONS: Record<StatTileId, typeof DocumentStatIcon> = {
  documents: DocumentStatIcon,
  streak: FlameStatIcon,
  xp: StarStatIcon,
  quizzes: TrophyStatIcon,
};

export function StatGrid({ stats }: { stats: StatTile[] }) {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {stats.map((tile) => {
        const Icon = ICONS[tile.id];
        return (
          <li
            key={tile.id}
            className="flex flex-col items-center gap-1 rounded-2xl bg-tile px-1 py-3"
          >
            <Icon className="size-4 text-primary-500" />
            <span className="text-base font-bold text-ink">{tile.value}</span>
            <span className="text-center text-[11px] leading-[1.25] text-subtle">
              {tile.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function StatGridSkeleton() {
  return (
    <ul className="grid grid-cols-4 gap-2" aria-hidden="true">
      {["a", "b", "c", "d"].map((key) => (
        <li
          key={key}
          className="flex h-[83px] flex-col items-center justify-center gap-2 rounded-2xl bg-tile px-1 py-3"
        >
          <span className="size-4 rounded bg-white/70" />
          <span className="h-4 w-6 rounded bg-white/70" />
          <span className="h-2.5 w-10 rounded bg-white/70" />
        </li>
      ))}
    </ul>
  );
}
