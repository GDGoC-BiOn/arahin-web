import type { Task } from "../domain/task";
import type { TaskDto } from "./task-schemas";

export function toTask(dto: TaskDto): Task {
  return {
    id: dto.id,
    title: dto.title,
    ...(dto.description ? { description: dto.description } : {}),
    createdAt: new Date(dto.createdAt),
  };
}

export function toTaskDto(task: Task): TaskDto {
  return { ...task, createdAt: task.createdAt.toISOString() };
}
