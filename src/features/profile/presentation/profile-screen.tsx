"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { CrownBadgeIcon } from "@/shared/presentation/icons/profile-icons";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import {
  type AppTab,
  BottomTabBar,
} from "@/shared/presentation/navigation/bottom-tab-bar";
import type {
  ProfileUseCases,
  ProfileView,
} from "../application/profile-use-cases";
import { initialOf } from "../domain/profile-stats";
import { FADE } from "./motion-tokens";
import { ProfileHeader } from "./profile-header";
import { SettingsList } from "./settings-list";
import { StatGrid, StatGridSkeleton } from "./stat-grid";
import { StreakCard, StreakCardSkeleton } from "./streak-card";

export function ProfileScreen({
  useCases,
  fallbackName,
  signOutSlot,
  onBack,
  onSelectTab,
  onEditProfile,
  onOpenNotifications,
}: {
  useCases: ProfileUseCases;
  /** From the server-rendered session, so the name is right on first paint. */
  fallbackName: string;
  signOutSlot: ReactNode;
  onBack: () => void;
  onSelectTab: (tab: AppTab) => void;
  onEditProfile: () => void;
  onOpenNotifications: () => void;
}) {
  const [view, setView] = useState<ProfileView | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setView(await useCases.loadProfile());
    } catch {
      // The name and the sign-out control still work without these numbers,
      // so a failed fetch degrades the screen rather than replacing it.
      setFailed(true);
    }
  }, [useCases]);

  useEffect(() => {
    void load();
  }, [load]);

  const name = view?.user.fullName ?? fallbackName;

  return (
    <AppPanel>
      <ProfileHeader onBack={onBack} />

      <main id="main" className="flex flex-1 flex-col overflow-y-auto pb-6">
        <div className="flex flex-col items-center px-6 pt-4 pb-6">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary-500 text-[30px] font-bold text-white">
            {initialOf(name)}
          </span>
          <p className="pt-3 text-base font-bold text-ink">{name}</p>
          {view && useCases.subtitleOf(view.user) ? (
            <p className="pt-1 text-xs text-muted">
              {useCases.subtitleOf(view.user)}
            </p>
          ) : null}
          {view?.premium === true ? (
            <span className="mt-2 flex items-center gap-1.5 rounded-full bg-amber-soft px-4 py-1.5">
              <CrownBadgeIcon className="size-3.5 text-amber" />
              <span className="text-xs font-semibold text-amber">
                Premium Plan
              </span>
            </span>
          ) : view?.premium === false ? (
            <span className="mt-2 flex items-center gap-1.5 rounded-full bg-chip px-4 py-1.5">
              <span className="text-xs font-semibold text-subtle">
                Free Plan
              </span>
            </span>
          ) : null}
        </div>

        {/*
            Three requests land at once; without a bridge the whole screen
            would snap into place. Heights are reserved by the skeletons, so
            the swap costs no layout shift.
          */}
        <div className="flex flex-col gap-5 px-6">
          <AnimatePresence initial={false} mode="popLayout">
            {view ? (
              <motion.div
                key="loaded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={FADE}
                className="flex flex-col gap-5"
              >
                <StatGrid stats={view.stats} />
                <StreakCard
                  days={view.streakDays}
                  dailyStreak={view.dailyStreak}
                />
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                exit={{ opacity: 0 }}
                transition={FADE}
                className="flex flex-col gap-5"
              >
                <StatGridSkeleton />
                <StreakCardSkeleton />
              </motion.div>
            )}
          </AnimatePresence>

          {failed ? (
            <p role="alert" className="text-xs font-semibold text-[#e8395b]">
              Statistik gagal dimuat. Coba muat ulang halaman.
            </p>
          ) : null}

          <SettingsList
            signOutSlot={signOutSlot}
            onEditProfile={onEditProfile}
            onOpenNotifications={onOpenNotifications}
            unreadNotifications={view?.unreadNotifications ?? null}
          />
        </div>
      </main>

      <BottomTabBar active="profile" onSelect={onSelectTab} />
    </AppPanel>
  );
}
