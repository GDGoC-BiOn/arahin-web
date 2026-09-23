"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import {
  type AppTab,
  BottomTabBar,
} from "@/shared/presentation/navigation/bottom-tab-bar";
import type { JourneyUseCases } from "../application/journey-use-cases";
import type { TimelineSession } from "../domain/session";
import { FADE } from "./motion-tokens";
import { SessionNode } from "./session-node";
import { SessionRail, TrackHeader } from "./track-timeline";

const GENERATION_POLL_MS = 2_500;

export function JourneyScreen({
  useCases,
  spaceId,
  generationId,
  onBack,
  onOpenSession,
  onSelectTab,
}: {
  useCases: JourneyUseCases;
  spaceId: string;
  generationId?: string | null;
  onBack: () => void;
  onOpenSession: (session: TimelineSession) => void;
  onSelectTab: (tab: AppTab) => void;
}) {
  const [preview, setPreview] = useState<TimelineSession | null>(null);

  const generationQuery = useQuery({
    queryKey: ["journey", "generation", spaceId, generationId],
    queryFn: () =>
      useCases.loadGenerationTimeline(spaceId, generationId as string),
    enabled: Boolean(generationId),
    refetchInterval: (query) => {
      const status = query.state.data?.job.status;
      return status === "completed" ||
        status === "failed" ||
        status === "cancelled"
        ? false
        : GENERATION_POLL_MS;
    },
  });

  const generationStatus = generationQuery.data?.job.status;
  const shouldLoadFinal = !generationId || generationStatus === "completed";

  const timelineQuery = useQuery({
    queryKey: ["journey", "timeline", spaceId],
    queryFn: () => useCases.loadTimeline(spaceId),
    enabled: shouldLoadFinal,
  });

  const tracks = shouldLoadFinal
    ? (timelineQuery.data ?? null)
    : generationQuery.data
      ? [generationQuery.data.track]
      : null;

  let error: string | null = null;
  if (generationStatus === "failed" || generationStatus === "cancelled") {
    error =
      generationQuery.data?.job.errorMessage ?? "Pembuatan materi gagal.";
  } else if (generationQuery.isError) {
    error = "Gagal memuat progres materi. Coba lagi.";
  } else if (timelineQuery.isError) {
    const status = (timelineQuery.error as { status?: number } | null)?.status;
    error =
      status === 404
        ? "Materi belum dibuat untuk dokumen ini."
        : "Gagal memuat sesi. Coba lagi.";
  }

  const open = (session: TimelineSession) => {
    if (session.previewMarkdown) {
      setPreview(session);
      return;
    }
    onOpenSession(session);
  };

  return (
    <AppPanel>
      <main id="main" className="relative flex flex-1 flex-col overflow-y-auto">
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
                            onOpen={open}
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

        <AnimatePresence>
          {preview?.previewMarkdown ? (
            <motion.div
              className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-[#f8fafc] p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={FADE}
            >
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="mb-4 self-start rounded-xl px-3 py-2 text-sm font-semibold text-primary-500"
              >
                Kembali ke Journey
              </button>
              <h2 className="mb-4 text-xl font-bold text-ink">
                {preview.title}
              </h2>
              <article className="w-full rounded-[20px] border border-[#cbd5e1] bg-[#f1f5f9] p-4">
                <pre className="font-sans text-xs leading-[1.6] whitespace-pre-wrap break-words text-[#475569]">
                  {preview.previewMarkdown}
                </pre>
              </article>
              <p className="mt-4 text-xs text-subtle">
                Materi lain tetap dibuat di background. Kuis tersedia setelah
                generation selesai.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
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
