import type { Task } from "../domain/task";
import type { TaskRepository } from "../domain/task-repository";

export function createMemoryTaskRepository(seed: Task[] = []): TaskRepository {
  const tasks = seed.map(copyTask);
  return {
    async list() {
      return tasks
        .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(copyTask);
    },
    async create(input) {
      const task = { ...input, id: crypto.randomUUID(), createdAt: new Date() };
      tasks.unshift(task);
      return copyTask(task);
    },
  };
}

function copyTask(task: Task): Task {
  return { ...task, createdAt: new Date(task.createdAt) };
}

export function seedTasks(): Task[] {
  const now = Date.now();
  return [
    {
      id: crypto.randomUUID(),
      title: "Make room for what matters",
      description: "Pick one small thing that will move your day forward.",
      createdAt: new Date(now),
    },
    {
      id: crypto.randomUUID(),
      title: "Turn an idea into a first step",
      description: "Big plans start with something you can do today.",
      createdAt: new Date(now - 60_000),
    },
  ];
}
