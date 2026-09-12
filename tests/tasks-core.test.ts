import { describe, expect, it, vi } from "vitest";
import { createTaskUseCases } from "@/features/tasks/application/task-use-cases";
import {
  normalizeTaskInput,
  type Task,
  TaskValidationError,
} from "@/features/tasks/domain/task";
import type { TaskRepository } from "@/features/tasks/domain/task-repository";
import {
  createMemoryTaskRepository,
  seedTasks,
} from "@/features/tasks/infrastructure/memory-task-repository";

describe("task rules", () => {
  it("trims text and removes blank descriptions", () => {
    expect(
      normalizeTaskInput({
        title: "  Plan today  ",
        description: "  notes \n",
      }),
    ).toEqual({ title: "Plan today", description: "notes" });
    expect(normalizeTaskInput({ title: "One", description: " \n " })).toEqual({
      title: "One",
    });
    expect(normalizeTaskInput({ title: "One" })).toEqual({ title: "One" });
  });
  it.each(["", " \n ", "a".repeat(61)])("rejects invalid title %j", (title) => {
    expect(() => normalizeTaskInput({ title })).toThrow(TaskValidationError);
  });
  it("accepts the exact limits after trimming", () => {
    expect(
      normalizeTaskInput({
        title: ` ${"a".repeat(60)} `,
        description: ` ${"b".repeat(240)} `,
      }),
    ).toEqual({ title: "a".repeat(60), description: "b".repeat(240) });
  });
  it("reports both invalid fields", () => {
    try {
      normalizeTaskInput({ title: "", description: "x".repeat(241) });
    } catch (error) {
      expect(error).toBeInstanceOf(TaskValidationError);
      expect((error as TaskValidationError).fields).toHaveProperty(
        "description",
      );
      expect((error as TaskValidationError).fields).toHaveProperty("title");
      return;
    }
    throw new Error("Expected validation to fail");
  });
});

describe("use cases", () => {
  const task: Task = { id: "task", title: "Plan", createdAt: new Date() };
  function setup() {
    const repository: TaskRepository = {
      list: vi.fn().mockResolvedValue([task]),
      create: vi.fn().mockResolvedValue(task),
    };
    return { repository, useCases: createTaskUseCases(repository) };
  }
  it("lists through the injected port", async () => {
    const { repository, useCases } = setup();
    expect(await useCases.list()).toEqual([task]);
    expect(repository.list).toHaveBeenCalledOnce();
  });
  it("normalizes before invoking create", async () => {
    const { repository, useCases } = setup();
    expect(await useCases.create({ title: " Plan ", description: " " })).toBe(
      task,
    );
    expect(repository.create).toHaveBeenCalledWith({ title: "Plan" });
  });
  it("does not call the repository for invalid input", () => {
    const { repository, useCases } = setup();
    expect(() => useCases.create({ title: " " })).toThrow(TaskValidationError);
    expect(repository.create).not.toHaveBeenCalled();
  });
  it("preserves repository failures", async () => {
    const error = new Error("Unavailable");
    const useCases = createTaskUseCases({
      list: vi.fn().mockRejectedValue(error),
      create: vi.fn().mockRejectedValue(error),
    });
    await expect(useCases.list()).rejects.toBe(error);
    await expect(useCases.create({ title: "Plan" })).rejects.toBe(error);
  });
});

describe("in-memory repository", () => {
  it("seeds two tasks and returns newest first", async () => {
    const seed = seedTasks();
    const tasks = await createMemoryTaskRepository(seed.toReversed()).list();
    expect(tasks).toHaveLength(2);
    expect(tasks[0]?.createdAt.getTime()).toBeGreaterThan(
      tasks[1]?.createdAt.getTime() ?? 0,
    );
  });
  it("creates UUIDs and server dates, and isolates returned objects", async () => {
    const repository = createMemoryTaskRepository();
    const task = await repository.create({ title: "Plan" });
    expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(task.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    task.title = "changed";
    task.createdAt.setFullYear(2000);
    const tasks = await repository.list();
    expect(tasks[0]?.title).toBe("Plan");
    expect(tasks[0]?.createdAt.getFullYear()).not.toBe(2000);
    tasks.pop();
    expect(await repository.list()).toHaveLength(1);
    expect(await createMemoryTaskRepository().list()).toEqual([]);
  });
});
