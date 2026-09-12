"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { TaskUseCases } from "../application/task-use-cases";
import { type TaskFormValues, taskFormSchema } from "./task-form-schema";
import { useTasks } from "./use-tasks";

const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function TaskWorkspace({ useCases }: { useCases: TaskUseCases }) {
  const { query, mutation } = useTasks(useCases);
  const [announcement, setAnnouncement] = useState("");
  const submitting = useRef(false);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { title: "", description: "" },
  });
  useEffect(() => {
    // Focus after reset has committed and RHF has registered the inputs again.
    if (announcement) setFocus("title");
  }, [announcement, setFocus]);

  async function submit(values: TaskFormValues) {
    if (submitting.current) return;
    submitting.current = true;
    setAnnouncement("");
    try {
      await mutation.mutateAsync(values);
      reset();
      setAnnouncement("Task added. One step closer.");
    } catch {
      // Mutation owns rollback; preserve every form value for retry.
    } finally {
      submitting.current = false;
    }
  }
  const tasks = query.data ?? [];
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <section aria-labelledby="task-list-title" className="min-w-0">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2
              id="task-list-title"
              className="text-xl font-semibold tracking-tight"
            >
              Your next steps
            </h2>
            {query.data ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
                {tasks.length}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-stone-500">Newest first</span>
        </div>
        {query.isPending && !query.data ? (
          <div
            role="status"
            className="rounded-2xl border border-stone-200 bg-white p-7"
          >
            <p className="text-sm text-stone-600">Loading your next steps…</p>
            <div
              aria-hidden="true"
              className="mt-6 space-y-4 motion-safe:animate-pulse"
            >
              <div className="h-4 w-2/3 rounded bg-stone-100" />
              <div className="h-4 w-1/2 rounded bg-stone-100" />
            </div>
          </div>
        ) : null}
        {query.isError ? (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"
          >
            <p>{query.error.message}</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              disabled={query.isFetching || mutation.isPending}
              className="mt-3 font-semibold underline underline-offset-4 disabled:opacity-50"
            >
              {query.isFetching ? "Trying again…" : "Try again"}
            </button>
          </div>
        ) : null}
        {query.isSuccess && tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-16 text-center">
            <span aria-hidden="true" className="text-3xl text-emerald-700">
              ↗
            </span>
            <h3 className="mt-4 font-semibold">
              A little space for your next idea.
            </h3>
            <p className="mt-2 text-sm text-stone-500">
              Add your first task. Start as small as you like.
            </p>
          </div>
        ) : null}
        <ul
          className="space-y-3"
          aria-label="Tasks"
          aria-busy={mutation.isPending}
        >
          {tasks.map((task) => {
            const pending = task.id.startsWith("pending-");
            return (
              <li
                key={task.id}
                className={`flex gap-4 rounded-2xl border bg-white p-5 sm:p-6 ${pending ? "border-emerald-300" : "border-stone-200"}`}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-lg text-emerald-800"
                >
                  ↗
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold leading-6 tracking-tight">
                    {task.title}
                  </h3>
                  {task.description ? (
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-stone-600">
                      {task.description}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
                    {pending ? (
                      <span className="text-emerald-800">Saving…</span>
                    ) : (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 rounded-full bg-stone-400"
                        />
                        <time dateTime={task.createdAt.toISOString()}>
                          {dateFormat.format(task.createdAt)}
                        </time>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-center text-xs leading-5 text-stone-500">
          A clear head starts with a place to put things.
        </p>
      </section>
      <aside
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_8px_32px_-20px_#29252430] sm:p-7"
        aria-labelledby="create-task-title"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2
              id="create-task-title"
              className="text-xl font-semibold tracking-tight"
            >
              Make a little progress.
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              One task. One step in the right direction.
            </p>
          </div>
          <span aria-hidden="true" className="text-2xl text-emerald-700">
            +
          </span>
        </div>
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="task-title"
              className="mb-2 block text-sm font-semibold"
            >
              Task title{" "}
              <span className="font-normal text-stone-500">(required)</span>
            </label>
            <input
              {...register("title")}
              id="task-title"
              placeholder="What’s on your mind?"
              autoComplete="off"
              readOnly={mutation.isPending}
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={
                errors.title ? "title-error title-hint" : "title-hint"
              }
              className="field"
            />
            <p id="title-hint" className="mt-2 text-xs text-stone-500">
              Keep it simple. Up to 60 characters.
            </p>
            {errors.title ? (
              <p
                id="title-error"
                role="alert"
                className="mt-2 text-sm text-red-700"
              >
                {errors.title.message}
              </p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="task-description"
              className="mb-2 block text-sm font-semibold"
            >
              A little context{" "}
              <span className="font-normal text-stone-500">(optional)</span>
            </label>
            <textarea
              {...register("description")}
              id="task-description"
              rows={4}
              placeholder="Add a detail, a thought, or a starting point…"
              readOnly={mutation.isPending}
              aria-invalid={!!errors.description}
              aria-describedby={
                errors.description
                  ? "description-error description-hint"
                  : "description-hint"
              }
              className="field resize-y"
            />
            <p id="description-hint" className="mt-2 text-xs text-stone-500">
              Up to 240 characters.
            </p>
            {errors.description ? (
              <p
                id="description-error"
                role="alert"
                className="mt-2 text-sm text-red-700"
              >
                {errors.description.message}
              </p>
            ) : null}
          </div>
          {mutation.isError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-800"
            >
              {mutation.error.message} Your details are still here.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
          >
            {mutation.isPending ? "Adding your task…" : "Add task"}
            <span aria-hidden="true">↗</span>
          </button>
          <p
            role="status"
            className="min-h-5 text-center text-xs leading-5 text-emerald-800"
          >
            {announcement ||
              (mutation.isPending
                ? "Saving your next step…"
                : "Small steps count.")}
          </p>
        </form>
      </aside>
    </div>
  );
}
