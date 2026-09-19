"use client";

import { motion } from "motion/react";
import {
  ArrowLeftIcon,
  MoonIcon,
} from "@/shared/presentation/icons/profile-icons";
import { PRESS } from "./motion-tokens";

export function ProfileHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex items-center justify-center gap-3 px-6 py-3">
      <motion.button
        type="button"
        onClick={onBack}
        aria-label="Kembali"
        whileTap={{ scale: 0.92 }}
        transition={PRESS}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chip text-[#101010]"
      >
        <ArrowLeftIcon className="size-[18px]" />
      </motion.button>

      <h1 className="flex-1 text-center text-base font-bold text-ink">
        Profile
      </h1>

      {/*
        Dark mode has no implementation anywhere in this app — there is no dark
        palette for any screen. Rendering the control inert keeps the design's
        header balance without offering something that cannot happen.
      */}
      <button
        type="button"
        disabled
        aria-label="Mode gelap — segera hadir"
        className="flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-chip text-[#0f172a] opacity-40"
      >
        <MoonIcon className="size-4" />
      </button>
    </header>
  );
}
