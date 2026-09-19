"use client";

import { motion } from "motion/react";
import {
  TabAccountIcon,
  TabHomeIcon,
  TabJourneyIcon,
} from "../icons/profile-icons";

export type AppTab = "home" | "journey" | "profile";

/**
 * Shared by the Home and Profile screens, which is why it lives here: a
 * feature may not import another feature's presentation layer.
 *
 * Figma spec: px-32, 56px targets, 24px filled glyphs, 12px semibold labels.
 */
const TABS = [
  { id: "home", label: "Home", Icon: TabHomeIcon },
  { id: "journey", label: "Journey", Icon: TabJourneyIcon },
  { id: "profile", label: "Profil", Icon: TabAccountIcon },
] as const;

const PRESS = { duration: 0.14, ease: [0.23, 1, 0.32, 1] } as const;

export function BottomTabBar({
  active,
  onSelect,
}: {
  active: AppTab;
  onSelect: (tab: AppTab) => void;
}) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="flex shrink-0 items-center justify-between border-t border-[#f1f5f9] bg-white px-8 pt-2 pb-1"
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <motion.button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? "page" : undefined}
            whileTap={{ scale: 0.94 }}
            transition={PRESS}
            className={`flex size-14 flex-col items-center justify-center gap-2 p-1 text-xs font-semibold transition-colors duration-150 ease-out ${
              isActive ? "text-primary-500" : "text-subtle"
            }`}
          >
            <Icon className="size-6" />
            {label}
          </motion.button>
        );
      })}
    </nav>
  );
}
