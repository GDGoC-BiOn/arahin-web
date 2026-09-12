import { type CreateTaskInput, normalizeTaskInput } from "../domain/task";
import type { TaskRepository } from "../domain/task-repository";

export function createTaskUseCases(repository: TaskRepository) {
  return {
    list: () => repository.list(),
    create: (input: CreateTaskInput) =>
      repository.create(normalizeTaskInput(input)),
  };
}

export type TaskUseCases = ReturnType<typeof createTaskUseCases>;
