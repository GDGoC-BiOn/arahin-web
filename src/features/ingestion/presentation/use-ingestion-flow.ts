"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GenerationFailedError,
  type IngestionResult,
  type IngestionUseCases,
  UploadRejectedError,
} from "../application/ingestion-use-cases";
import {
  type GenerationJob,
  lessonProgressLabel,
} from "../domain/generation-job";
import { describeFailure, type FailureCopy } from "../domain/ingestion-failure";
import {
  captionForGenerationStage,
  INITIAL_INGESTION_STATE,
  type IngestionPhase,
  type IngestionState,
  ingestionPercent,
  ingestionSteps,
} from "../domain/ingestion-progress";
import { PROGRESS_TICK_MS } from "./motion-tokens";

export type IngestionFailure = FailureCopy & {
  /** Backend code, or a local rejection reason. */
  code: string;
  /** True when nothing was ever sent, so "try another file" is the only fix. */
  local: boolean;
};

// Uploading is included because a small file yields a single progress event
// at the very end: without a tick the bar would sit still until it lands.
const OPEN_ENDED: IngestionPhase[] = ["uploading", "parsing", "generating"];

export function useIngestionFlow(options: {
  useCases: IngestionUseCases;
  onComplete: (result: IngestionResult) => void;
  onFirstLessonReady?: (job: GenerationJob) => void;
}) {
  const { useCases, onComplete, onFirstLessonReady } = options;
  const [state, setState] = useState<IngestionState>(INITIAL_INGESTION_STATE);
  const [failure, setFailure] = useState<IngestionFailure | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stage, setStage] = useState<string | undefined>(undefined);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const phaseStartedAt = useRef<number>(0);
  const running = useRef(false);
  const lastFile = useRef<File | null>(null);
  const handedOffToJourney = useRef(false);

  /**
   * Only the open-ended phases need a ticker, and 200ms is plenty: the bar's
   * spring interpolates between readings, so this drives motion without
   * waking the main thread every frame.
   */
  useEffect(() => {
    if (!OPEN_ENDED.includes(state.phase)) return;
    const id = setInterval(() => {
      setState((current) => ({
        ...current,
        elapsedInPhaseMs: Date.now() - phaseStartedAt.current,
      }));
    }, PROGRESS_TICK_MS);
    return () => clearInterval(id);
  }, [state.phase]);

  const observe = useCallback((phase: IngestionPhase) => {
    phaseStartedAt.current = Date.now();
    setState((current) => ({
      ...current,
      phase,
      elapsedInPhaseMs: 0,
    }));
    if (phase !== "generating") setStage(undefined);
  }, []);

  const observeJob = useCallback(
    (job: GenerationJob) => {
      setStage(job.stage);
      setJob(job);

      if (!handedOffToJourney.current && onFirstLessonReady) {
        const ordered = [...(job.lessons ?? [])].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
        const first = ordered[0];
        if (
          first?.status === "completed" &&
          first.contentMarkdown &&
          job.status === "running"
        ) {
          handedOffToJourney.current = true;
          onFirstLessonReady(job);
        }
      }
    },
    [onFirstLessonReady],
  );

  const start = useCallback(
    async (file: File) => {
      if (running.current) return;
      running.current = true;
      lastFile.current = file;
      setFailure(null);
      setFileName(file.name);
      setStage(undefined);
      setJob(null);
      handedOffToJourney.current = false;
      phaseStartedAt.current = Date.now();
      setState({ ...INITIAL_INGESTION_STATE, phase: "uploading" });

      try {
        const result = await useCases.ingestDocument(file, {
          onPhase: observe,
          onGeneration: observeJob,
          onUploadProgress: (uploadedFraction) => {
            setState((current) =>
              uploadedFraction < current.uploadedFraction
                ? current
                : { ...current, uploadedFraction },
            );
          },
        });
        onComplete(result);
      } catch (error) {
        setState((current) => ({ ...current, phase: "failed" }));
        setFailure(toFailure(error));
      } finally {
        running.current = false;
      }
    },
    [observe, observeJob, onComplete, useCases],
  );

  useEffect(() => {
    if (running.current) return;
    running.current = true;
    void useCases
      .resumeGeneration({
        onPhase: observe,
        onGeneration: observeJob,
        onResume: (name) => setFileName(name ?? null),
        onUploadProgress: () => {},
      })
      .then((result) => {
        if (result) {
          if (result.fileName) setFileName(result.fileName);
          onComplete(result);
        }
      })
      .catch((error) => {
        setState((current) => ({ ...current, phase: "failed" }));
        setFailure(toFailure(error));
      })
      .finally(() => {
        running.current = false;
      });
  }, [observe, observeJob, onComplete, useCases]);

  const reset = useCallback(() => {
    setState(INITIAL_INGESTION_STATE);
    setFailure(null);
    setFileName(null);
    setStage(undefined);
    setJob(null);
    handedOffToJourney.current = false;
  }, []);

  /** Same file again — for failures on our side, not the file's. */
  const retry = useCallback(() => {
    if (lastFile.current) void start(lastFile.current);
    else reset();
  }, [reset, start]);

  return {
    retry,
    phase: state.phase,
    percent: ingestionPercent(state),
    lessonProgress: lessonProgressLabel(job),
    durable: Boolean(job?.generationId),
    steps: ingestionSteps(state),
    caption: captionForGenerationStage(stage, state.phase),
    fileName,
    failure,
    generation: job,
    lessons: job?.lessons ?? [],
    canRetry: lastFile.current !== null,
    busy: state.phase !== "idle" && state.phase !== "failed",
    start,
    reset,
  };
}

type ApiLike = { code?: unknown; status?: unknown };

function toFailure(error: unknown): IngestionFailure {
  if (error instanceof UploadRejectedError) {
    return {
      ...describeFailure(error.rejection.reason),
      message: error.message,
      code: error.rejection.reason,
      local: true,
    };
  }
  if (error instanceof GenerationFailedError) {
    return { ...describeFailure(error.code), code: error.code, local: false };
  }
  const candidate = error as ApiLike | null;
  const code =
    typeof candidate?.code === "string" ? candidate.code : "INTERNAL";
  const status =
    typeof candidate?.status === "number" ? candidate.status : undefined;
  return { ...describeFailure(code, status), code, local: false };
}
