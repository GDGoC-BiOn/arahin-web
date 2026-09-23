"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import {
  type AppTab,
  BottomTabBar,
} from "@/shared/presentation/navigation/bottom-tab-bar";
import type { IngestionUseCases } from "../application/ingestion-use-cases";
import type { DueReview } from "../domain/learning-space";
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
import { RecentUploads, toRecentUploads } from "./recent-uploads";
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
  onOpenSpace: (spaceId: string, generationId?: string) => void;
  onSelectTab: (tab: AppTab) => void;
  onSignIn: () => void;
  onReview: (review: DueReview) => void;
}) {
  const queryClient = useQueryClient();
  const mounted = useRef(true);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setSearched(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const reviewsQuery = useQuery({
    queryKey: ["ingestion", "due-reviews"],
    queryFn: () => useCases.listDueReviews(),
    // Reviews are a nudge, never a blocker.
    retry: false,
  });

  const uploadsQuery = useQuery({
    queryKey: ["ingestion", "recent-uploads", searched],
    queryFn: async () => {
      const [spaces, progress] = await Promise.all([
        useCases.listSpaces(searched),
        useCases.listProgress(),
      ]);
      return toRecentUploads(spaces, progress);
    },
    // The upload box remains usable even when supporting history fails.
    retry: false,
  });

  const flow = useIngestionFlow({
    useCases,
    onFirstLessonReady: (job) => {
      if (!mounted.current) return;
      onOpenSpace(job.spaceId, job.generationId);
    },
    onComplete: (result) => {
      if (!mounted.current) return;
      void queryClient.invalidateQueries({
        queryKey: ["ingestion", "recent-uploads"],
      });
      onOpenSpace(result.spaceId);
    },
  });

  return (
    <AppPanel>
      <AnimatePresence initial={false} mode="popLayout">
        {flow.busy ? (
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
              lessons={flow.lessons}
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
            <UploadDropzone
              disabled={flow.busy}
              onFile={(file) => {
                void flow.start(file);
              }}
            />
            {searched ? null : (
              <DueReviews
                reviews={reviewsQuery.data ?? []}
                onOpen={onReview}
              />
            )}
            <RecentUploads
              uploads={uploadsQuery.data ?? []}
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
        canRetry={flow.canRetry}
        onRetry={flow.failure?.kind === "service" ? flow.retry : flow.reset}
        onHome={flow.reset}
        onSignIn={onSignIn}
      />

      {!flow.busy ? (
        <BottomTabBar active="home" onSelect={onSelectTab} />
      ) : null}
    </AppPanel>
  );
}
