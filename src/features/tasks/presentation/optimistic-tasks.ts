import type { Task } from "../domain/task";

export function insertOptimistic(
  snapshot: Task[] | undefined,
  temporary: Task,
): Task[] {
  return [temporary, ...(snapshot ?? [])];
}

export function reconcileTask(
  tasks: Task[] | undefined,
  temporaryId: string,
  saved: Task,
): Task[] {
  if (!tasks?.some((task) => task.id === temporaryId))
    return [saved, ...(tasks ?? [])];
  return tasks.map((task) => (task.id === temporaryId ? saved : task));
}

export function rollbackTasks(
  snapshot: Task[] | undefined,
): Task[] | undefined {
  return snapshot;
}
