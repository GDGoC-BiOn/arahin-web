"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type {
  WorkshopApi,
  WorkshopAttemptResult,
  WorkshopLesson,
  WorkshopQuizAnswer,
  WorkshopTrack,
} from "../domain/workshop";
import {
  WorkshopJourneyScreen,
  type WorkshopJourneyStep,
  WorkshopQuizScreen,
  type WorkshopStepStatus,
} from "./workshop-ui";

type WorkshopStep = WorkshopJourneyStep & {
  lesson: WorkshopLesson;
};

const answerFormSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

type AnswerFormValues = z.infer<typeof answerFormSchema>;

/**
 * TODO 1 — derive the same journey state production ArahIn renders.
 *
 * Replace the starter rule with:
 * - completed lesson -> done
 * - first incomplete lesson -> current
 * - every later lesson -> locked
 */
function buildWorkshopSteps(track: WorkshopTrack): WorkshopStep[] {
  return [...track.lessons]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((lesson, index) => ({
      id: lesson.id,
      lesson,
      position: index + 1,
      title: lesson.title,
      side: (index % 2 === 0 ? "right" : "left") as "left" | "right",
      status: (index === 0 ? "current" : "locked") as WorkshopStepStatus,
    }));
}

export function WorkshopStarter({ api }: { api: WorkshopApi }) {
  const queryClient = useQueryClient();
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [activeLesson, setActiveLesson] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<WorkshopAttemptResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const answerForm = useForm<AnswerFormValues>({
    resolver: zodResolver(answerFormSchema),
    defaultValues: { answers: {} },
  });
  const answers = answerForm.watch("answers");

  const spacesQuery = useQuery({
    queryKey: ["workshop", "spaces"],
    queryFn: () => api.listSpaces(),
  });

  useEffect(() => {
    if (selectedSpaceId || !spacesQuery.data?.length) return;
    const firstReady =
      spacesQuery.data.find((space) => space.hasTracks) ?? spacesQuery.data[0];
    if (firstReady) setSelectedSpaceId(firstReady.id);
  }, [selectedSpaceId, spacesQuery.data]);

  const tracksQuery = useQuery({
    queryKey: ["workshop", "tracks", selectedSpaceId],
    queryFn: () => api.loadTracks(selectedSpaceId),
    enabled: Boolean(selectedSpaceId),
  });

  const quizQuery = useQuery({
    queryKey: ["workshop", "quiz", selectedSpaceId, activeLesson?.id ?? null],
    queryFn: () => {
      if (!selectedSpaceId || !activeLesson) {
        throw new Error("Choose a lesson before loading a quiz.");
      }
      return api.loadQuiz(selectedSpaceId, activeLesson.id);
    },
    enabled: Boolean(selectedSpaceId && activeLesson),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: WorkshopQuizAnswer[]) => {
      if (!quizQuery.data) throw new Error("Quiz is not loaded.");
      return api.submitQuiz({
        source: quizQuery.data.source,
        answers: payload,
      });
    },
    onSuccess: (graded) => {
      setResult(graded);
      const hasReview = Boolean(graded.answers?.length);
      setReviewing(hasReview);
      setShowResult(!hasReview);
      setQuestionIndex(0);

      void queryClient.invalidateQueries({
        queryKey: ["workshop", "tracks", selectedSpaceId],
      });
    },
  });

  const tracks = tracksQuery.data ?? [];
  const track = useMemo(
    () => [...tracks].sort((a, b) => a.orderIndex - b.orderIndex)[0] ?? null,
    [tracks],
  );
  const steps = useMemo(
    () => (track ? buildWorkshopSteps(track) : []),
    [track],
  );

  const quiz = quizQuery.data ?? null;
  const currentQuestion = quiz?.quiz.items[questionIndex] ?? null;
  const selectedOption = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const complete =
    quiz?.quiz.items.every((item) => Boolean(answers[item.id])) ?? false;
  const feedback =
    reviewing && currentQuestion
      ? (result?.answers?.find(
          (answer) => answer.itemId === currentQuestion.id,
        ) ?? null)
      : null;

  function openLesson(step: WorkshopStep) {
    if (step.status === "locked") return;
    setActiveLesson({ id: step.lesson.id, title: step.lesson.title });
    setQuestionIndex(0);
    setResult(null);
    setReviewing(false);
    setShowResult(false);
    answerForm.reset({ answers: {} });
  }

  function leaveQuiz() {
    setActiveLesson(null);
    setQuestionIndex(0);
    setResult(null);
    setReviewing(false);
    setShowResult(false);
    answerForm.reset({ answers: {} });
  }

  /**
   * TODO 2 — React Hook Form answer state.
   *
   * Use answerForm.setValue() so one option id is stored under:
   * answers[itemId] = optionId
   */
  function selectOption(itemId: string, optionId: string) {
    void itemId;
    void optionId;
  }

  /**
   * TODO 2b — local navigation is UI state, not server state.
   *
   * Move forward by one without passing the last generated question.
   */
  function goNext() {
    // Implement during the workshop.
  }

  /**
   * TODO 3 — turn form values into the real submit contract.
   *
   * Build WorkshopQuizAnswer[] in generated-item order:
   * { itemId, optionId }
   */
  const submitQuiz = answerForm.handleSubmit((values) => {
    const payload: WorkshopQuizAnswer[] = [];
    void values;
    submitMutation.mutate(payload);
  });

  function reviewNext() {
    if (!quiz) return;

    if (questionIndex >= quiz.quiz.items.length - 1) {
      setReviewing(false);
      setShowResult(true);
      return;
    }

    setQuestionIndex((current) =>
      Math.min(current + 1, quiz.quiz.items.length - 1),
    );
  }

  function retryQuiz() {
    setQuestionIndex(0);
    setResult(null);
    setReviewing(false);
    setShowResult(false);
    answerForm.reset({ answers: {} });
  }

  let error: string | null = null;
  if (spacesQuery.isError) error = "Gagal memuat learning space.";
  else if (tracksQuery.isError) error = "Gagal memuat track dari API.";
  else if (quizQuery.isError) {
    error =
      "Quiz lesson ini belum tersedia. Tunggu generation selesai atau pilih lesson lain.";
  } else if (submitMutation.isError) {
    error = "Gagal mengirim quiz ke API.";
  }

  if (!activeLesson) {
    return (
      <WorkshopJourneyScreen
        title={track?.title ?? "Learning Journey"}
        subtitle={
          track?.description?.trim() ||
          (track ? `${track.lessons.length} sesi belajar` : "Memuat materi…")
        }
        steps={steps}
        loading={spacesQuery.isPending || tracksQuery.isPending}
        error={error}
        onBack={() => window.location.assign("/beranda")}
        onOpen={(step) =>
          openLesson(steps.find((candidate) => candidate.id === step.id) ?? steps[0])
        }
        onSelectTab={(tab) => {
          if (tab === "home") window.location.assign("/beranda");
          if (tab === "profile") window.location.assign("/profil");
        }}
      />
    );
  }

  return (
    <WorkshopQuizScreen
      question={
        currentQuestion?.question ??
        (quizQuery.isPending ? "Memuat soal…" : "Quiz belum tersedia")
      }
      questionIndex={questionIndex}
      questionCount={quiz?.quiz.items.length ?? 0}
      options={currentQuestion?.options ?? []}
      selectedOption={selectedOption}
      reviewing={reviewing}
      feedback={feedback}
      canGoBack={questionIndex > 0}
      complete={complete}
      submitting={submitMutation.isPending}
      error={error}
      result={result}
      showResult={showResult}
      onBack={leaveQuiz}
      onSelect={(optionId) => {
        if (currentQuestion) selectOption(currentQuestion.id, optionId);
      }}
      onPrevious={() =>
        setQuestionIndex((current) => Math.max(current - 1, 0))
      }
      onNext={goNext}
      onSubmit={() => void submitQuiz()}
      onReviewNext={reviewNext}
      onFinish={leaveQuiz}
      onRetry={retryQuiz}
    />
  );
}
