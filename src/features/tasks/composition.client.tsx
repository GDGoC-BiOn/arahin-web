"use client";
import { httpClient } from "@/shared/infrastructure/http/client";
import { createTaskUseCases } from "./application/task-use-cases";
import { createHttpTaskRepository } from "./infrastructure/http-task-repository";
import { TaskWorkspace } from "./presentation/task-workspace";

const useCases = createTaskUseCases(createHttpTaskRepository(httpClient));
export function TasksFeature() {
  return <TaskWorkspace useCases={useCases} />;
}
