"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import {
  type AppTab,
  BottomTabBar,
} from "@/shared/presentation/navigation/bottom-tab-bar";
import type { JourneyUseCases } from "../application/journey-use-cases";
import type { TimelineSession, TimelineTrack } from "../domain/session";
import { FADE } from "./motion-tokens";
import { SessionNode } from "./session-node";
import { SessionRail, TrackHeader } from "./track-timeline";

export function JourneyScreen({
  useCases,
  spaceId,
  onBack,
  onOpenSession,
  onSelectTab,
}: {
  useCases: JourneyUseCases;
  spaceId: string;
  onBack: () => void;
  onOpenSession: (session: TimelineSession) => void;
  onSelectTab: (tab: AppTab) => void;
}) {
  const [tracks, setTracks] = useState<TimelineTrack[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTracks(await useCases.loadTimeline(spaceId));
    } catch (cause) {
      // 404 here means "no blueprint generated yet", which the backend
      // deliberately conflates with a missing space. Say the actionable thing.
      const status = (cause as { status?: number } | null)?.status;
      setError(
        status === 404
          ? "Materi belum dibuat untuk dokumen ini."
          : "Gagal memuat sesi. Coba lagi.",
      );
    }
  }, [spaceId, useCases]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppPanel>
      <main id="main" className="flex flex-1 flex-col overflow-y-auto">
        <AnimatePresence initial={false} mode="popLayout">
          {tracks ? (
            <motion.div
              key="loaded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={FADE}
              className="flex flex-col"
            >
              {tracks.length === 0 ? (
                <EmptyState onBack={onBack} />
              ) : (
                tracks.map((track) => (
                  <section key={track.id}>
                    <TrackHeader track={track} onBack={onBack} />
                    <SessionRail track={track}>
                      {track.sessions.map((session, index) => (
                        <li key={session.id}>
                          <SessionNode
                            session={session}
                            index={index}
                            onOpen={onOpenSession}
                          />
                        </li>
                      ))}
                    </SessionRail>
                  </section>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              exit={{ opacity: 0 }}
              transition={FADE}
              className="flex flex-col"
            >
              <div className="h-[148px] rounded-b-[40px] bg-primary-500" />
              <div className="flex flex-col items-center gap-[66px] px-6 pt-16">
                {["a", "b", "c"].map((key) => (
                  <span
                    key={key}
                    className="size-16 rounded-[32px] border border-[#cbd5e1] bg-[#f1f5f9]"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <p role="alert" className="text-sm font-semibold text-[#e71e43]">
              {error}
            </p>
            <button
              type="button"
              onClick={onBack}
              className="rounded-[20px] bg-[#d9defb] px-4 py-2 text-sm font-semibold text-primary-500"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : null}
      </main>

      <BottomTabBar active="journey" onSelect={onSelectTab} />
    </AppPanel>
  );
}

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
      <p className="text-base font-bold text-ink">Belum ada sesi</p>
      <p className="text-xs leading-[1.5] text-subtle">
        Materi belajar dibuat setelah dokumen kamu diproses AI.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="rounded-[20px] bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
      >
        Unggah dokumen
      </button>
    </div>
  );
}
