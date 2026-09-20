"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import {
  type AppTab,
  BottomTabBar,
} from "@/shared/presentation/navigation/bottom-tab-bar";
import type { IngestionUseCases } from "../application/ingestion-use-cases";
import type {
  DueReview,
  SpaceProgress,
  SpaceSummary,
} from "../domain/learning-space";
import { DetectionFailedSheet } from "./detection-failed-sheet";
import { DueReviews } from "./due-reviews";
import {
  AiRecommendationCard,
  HomeHeadline,
  HomeSearch,
  ThreeStepGuide,
} from "./home-sections";
import { FADE } from "./motion-tokens";
import { ProcessingScreen } from "./processing-screen";
import {
  type RecentUpload,
  RecentUploads,
  toRecentUploads,
} from "./recent-uploads";
import { UploadDropzone } from "./upload-dropzone";
import { useIngestionFlow } from "./use-ingestion-flow";

export function HomeScreen({
  useCases,
  greetingName,
  onOpenSpace,
  onSelectTab,
  onSignIn,
  onReview,
}: {
  useCases: IngestionUseCases;
  greetingName: string;
  onOpenSpace: (spaceId: string) => void;
  onSelectTab: (tab: AppTab) => void;
  onSignIn: () => void;
  onReview: (review: DueReview) => void;
}) {
  const [reviews, setReviews] = useState<DueReview[]>([]);
  const [showProcessing, setShowProcessing] = useState(false);
  const showProcessingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const setProcessing = (visible: boolean) => {
    showProcessingRef.current = visible;
    setShowProcessing(visible);
  };

  useEffect(() => {
    let cancelled = false;
    useCases
      .listDueReviews()
      .then((due) => {
        if (!cancelled) setReviews(due);
      })
      // Reviews are a nudge, never a blocker.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [useCases]);
  const [uploads, setUploads] = useState<RecentUpload[] | null>(null);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");

  // Debounced so typing a word is one request, not one per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearched(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const loadUploads = useCallback(async () => {
    try {
      const [spaces, progress] = await Promise.all([
        useCases.listSpaces(searched),
        useCases.listProgress(),
      ]);
      setUploads(
        toRecentUploads(spaces as SpaceSummary[], progress as SpaceProgress[]),
      );
    } catch {
      // The list is supporting detail; failing to load it must not block the
      // one thing this screen exists for, which is uploading a document.
      setUploads([]);
    }
  }, [searched, useCases]);

  useEffect(() => {
    void loadUploads();
  }, [loadUploads]);

  const flow = useIngestionFlow({
    useCases,
    onComplete: (result) => {
      if (!mounted.current) return;
      void loadUploads();
      if (showProcessingRef.current) onOpenSpace(result.spaceId);
      setProcessing(false);
    },
  });

  return (
    <AppPanel>
      {/* Upload and parsing need the file in this tab. Once the durable job
          starts, the user can return home or navigate elsewhere. */}
      <AnimatePresence initial={false} mode="popLayout">
        {flow.busy && (flow.phase !== "generating" || showProcessing) ? (
          <motion.div
            key="processing"
            exit={{ opacity: 0 }}
            transition={FADE}
            className="flex flex-1 flex-col"
          >
            <ProcessingScreen
              percent={flow.percent}
              caption={flow.caption}
              steps={flow.steps}
              fileName={flow.fileName}
              lessonProgress={flow.lessonProgress}
              onLeave={flow.durable ? () => setProcessing(false) : undefined}
            />
          </motion.div>
        ) : (
          <motion.main
            key="home"
            id="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={FADE}
            className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pt-6 pb-6"
          >
            <HomeHeadline />
            <HomeSearch value={query} onChange={setQuery} />
            {flow.phase === "generating" ? (
              <section
                role="status"
                className="rounded-2xl border border-primary-500/20 bg-[#eef3ff] p-4 text-sm text-secondary-500"
              >
                <p className="font-semibold">
                  Materi sedang disiapkan di background
                </p>
                <p className="mt-1 text-subtle">
                  {flow.fileName ?? "Dokumen"} ·{" "}
                  {flow.lessonProgress ?? flow.caption}
                </p>
                <p className="mt-1 text-xs text-subtle">
                  Kamu boleh pindah halaman atau refresh. Hasil akan muncul di
                  unggahan terbaru saat siap.
                </p>
                <button
                  type="button"
                  onClick={() => setProcessing(true)}
                  className="mt-3 font-semibold text-primary-500"
                >
                  Lihat proses
                </button>
              </section>
            ) : null}
            <UploadDropzone
              disabled={flow.busy}
              onFile={(file) => {
                setProcessing(true);
                void flow.start(file);
              }}
            />
            {searched ? null : (
              <DueReviews reviews={reviews} onOpen={onReview} />
            )}
            <RecentUploads
              uploads={uploads ?? []}
              query={searched}
              onOpen={onOpenSpace}
              onSeeAll={() => onSelectTab("journey")}
            />
            <ThreeStepGuide />
            <AiRecommendationCard onStart={() => onSelectTab("journey")} />
            <p className="sr-only">Masuk sebagai {greetingName}</p>
          </motion.main>
        )}
      </AnimatePresence>

      <DetectionFailedSheet
        failure={flow.failure}
        onRetry={flow.failure?.kind === "service" ? flow.retry : flow.reset}
        onHome={flow.reset}
        onSignIn={onSignIn}
      />

      {!flow.busy || flow.durable ? (
        <BottomTabBar active="home" onSelect={onSelectTab} />
      ) : null}
    </AppPanel>
  );
}
