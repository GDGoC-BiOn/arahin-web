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
  JourneyStep,
  ResultPanel,
  WorkshopFrame,
  WorkshopQuizOption,
  type WorkshopStepStatus,
} from "./workshop-ui";

type WorkshopStep = {
  lesson: WorkshopLesson;
  position: number;
  status: WorkshopStepStatus;
};

const answerFormSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

type AnswerFormValues = z.infer<typeof answerFormSchema>;

/**
 * TODO 1 — derive stepper state from server truth.
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
      lesson,
      position: index + 1,
      status: index === 0 ? "current" : "locked",
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
  const isLastQuestion =
    quiz !== null && questionIndex === quiz.quiz.items.length - 1;
  const complete =
    quiz?.quiz.items.every((item) => Boolean(answers[item.id])) ?? false;

  function changeSpace(spaceId: string) {
    setSelectedSpaceId(spaceId);
    setActiveLesson(null);
    setQuestionIndex(0);
    setResult(null);
    answerForm.reset({ answers: {} });
  }

  function openLesson(step: WorkshopStep) {
    if (step.status === "locked") return;
    setActiveLesson({ id: step.lesson.id, title: step.lesson.title });
    setQuestionIndex(0);
    setResult(null);
    answerForm.reset({ answers: {} });
  }

  /**
   * TODO 2 — React Hook Form answer state
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
   *
   * The mutation itself is already wired to the real API. Correct answers and
   * explanations only arrive in its response.
   */
  const submitQuiz = answerForm.handleSubmit((values) => {
    const payload: WorkshopQuizAnswer[] = [];
    void values;
    submitMutation.mutate(payload);
  });

  let error: string | null = null;
  if (spacesQuery.isError) error = "Gagal memuat learning space.";
  else if (tracksQuery.isError) error = "Gagal memuat track dari API.";
  else if (quizQuery.isError) {
    error =
      "Quiz lesson ini belum tersedia. Tunggu generation selesai atau pilih lesson lain.";
  } else if (submitMutation.isError) {
    error = "Gagal mengirim quiz ke API.";
  }

  return (
    <WorkshopFrame>
      <header className="flex flex-col gap-4 rounded-[24px] border border-[#cbd5e1] bg-white p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">
            ArahIn Workshop Starter
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            AI Generated It. Now Make It Interactive.
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-subtle">
            Real API, real generated quiz, dan real backend grading. Plumbing
            sudah disiapkan supaya hands-on fokus ke state transformation dan
            interaction.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-primary-500">
            Zod · API boundary
          </span>
          <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-primary-500">
            React Query · server state
          </span>
          <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-primary-500">
            React Hook Form · answers
          </span>
        </div>

        <a
          href="/beranda"
          className="self-start rounded-xl bg-primary-500 px-3 py-2 text-sm font-semibold text-white"
        >
          Generate materi di Beranda
        </a>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[24px] border border-[#cbd5e1] bg-white p-5">
          <div className="flex items-end justify-between gap-3">
            <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-semibold">
              Learning space
              <select
                value={selectedSpaceId}
                disabled={spacesQuery.isPending}
                onChange={(event) => changeSpace(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#cbd5e1] bg-white px-3 text-base font-normal"
              >
                <option value="">
                  {spacesQuery.isPending ? "Memuat..." : "Pilih learning space"}
                </option>
                {(spacesQuery.data ?? []).map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.title}
                    {space.hasTracks ? "" : " — masih diproses"}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => void tracksQuery.refetch()}
              disabled={!selectedSpaceId || tracksQuery.isFetching}
              className="min-h-11 rounded-xl border border-primary-500 px-3 text-sm font-semibold text-primary-500 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              TODO 1 · Server data → stepper
            </p>

            {tracksQuery.isPending && selectedSpaceId ? (
              <p className="mt-4 text-sm text-subtle">Memuat track nyata...</p>
            ) : track ? (
              <>
                <h2 className="mt-2 text-lg font-bold">{track.title}</h2>
                <ol className="mt-5 flex flex-col gap-4">
                  {steps.map((step) => (
                    <JourneyStep
                      key={step.lesson.id}
                      position={step.position}
                      title={step.lesson.title}
                      status={step.status}
                      onOpen={() => openLesson(step)}
                    />
                  ))}
                </ol>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-subtle">
                Belum ada track. Generate materi lewat Beranda, tunggu AI
                selesai, lalu refresh.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#cbd5e1] bg-[#f8fafc] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
            TODO 2–3 · Generated quiz
          </p>

          {quizQuery.isPending && activeLesson ? (
            <p className="mt-4 text-sm text-subtle">
              React Query sedang mengambil generated quiz...
            </p>
          ) : result ? (
            <div className="mt-4 flex flex-col gap-4">
              <ResultPanel result={result} />
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setQuestionIndex(0);
                  answerForm.reset({ answers: {} });
                }}
                className="rounded-xl border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-500"
              >
                Coba quiz lagi
              </button>
            </div>
          ) : quiz && currentQuestion ? (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-subtle">
                <span>{activeLesson?.title}</span>
                <span>
                  {questionIndex + 1}/{quiz.quiz.items.length}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                <div
                  className="h-full rounded-full bg-primary-500 transition-[width]"
                  style={{
                    width: `${((questionIndex + 1) / quiz.quiz.items.length) * 100}%`,
                  }}
                />
              </div>

              <h2 className="mt-6 text-xl font-bold leading-7">
                {currentQuestion.question}
              </h2>

              <div className="mt-5 flex flex-col gap-3">
                {currentQuestion.options.map((option) => (
                  <WorkshopQuizOption
                    key={option.id}
                    option={option}
                    selected={selectedOption === option.id}
                    disabled={submitMutation.isPending}
                    onSelect={() => selectOption(currentQuestion.id, option.id)}
                  />
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={questionIndex === 0 || submitMutation.isPending}
                  onClick={() =>
                    setQuestionIndex((current) => Math.max(current - 1, 0))
                  }
                  className="rounded-xl border border-[#cbd5e1] px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Sebelumnya
                </button>

                <button
                  type="button"
                  disabled={
                    !selectedOption ||
                    submitMutation.isPending ||
                    (isLastQuestion && !complete)
                  }
                  onClick={() => {
                    if (isLastQuestion) void submitQuiz();
                    else goNext();
                  }}
                  className="flex-1 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {submitMutation.isPending
                    ? "Mengirim..."
                    : isLastQuestion
                      ? "Submit ke API"
                      : "Soal berikutnya"}
                </button>
              </div>

              <p className="mt-4 text-xs leading-5 text-subtle">
                Browser hanya menerima question + options. Correct answer baru
                dikirim backend setelah mutation submit berhasil.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-5 text-sm leading-6 text-subtle">
              Klik lesson yang tidak terkunci untuk mengambil generated quiz
              lewat React Query.
            </div>
          )}
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-[#fecdd3] bg-[#fff1f2] p-4 text-sm font-semibold text-[#be123c]"
        >
          {error}
        </p>
      ) : null}

      <section className="rounded-[24px] border border-[#cbd5e1] bg-white p-5">
        <p className="text-sm font-bold">3 core checkpoints</p>
        <ol className="mt-3 grid gap-2 text-sm text-[#475569] sm:grid-cols-3">
          <li>1. Derive done / current / locked.</li>
          <li>2. Simpan answer + navigasi quiz.</li>
          <li>3. Bentuk payload dan submit real API.</li>
        </ol>
      </section>
    </WorkshopFrame>
  );
}
