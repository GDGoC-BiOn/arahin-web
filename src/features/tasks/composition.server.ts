import "server-only";
import { createTaskUseCases } from "./application/task-use-cases";
import type { TaskRepository } from "./domain/task-repository";
import {
  createMemoryTaskRepository,
  seedTasks,
} from "./infrastructure/memory-task-repository";
import { createTaskHandlers } from "./infrastructure/task-handlers";

// Preserve demo data through hot reloads, but never across processes.
const processState = globalThis as typeof globalThis & {
  arahinTasks?: TaskRepository;
};
processState.arahinTasks ??= createMemoryTaskRepository(seedTasks());
const repository = processState.arahinTasks;
export const taskHandlers = createTaskHandlers(createTaskUseCases(repository));
