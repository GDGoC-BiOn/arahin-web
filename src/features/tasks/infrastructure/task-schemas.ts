import { z } from "zod";
import { TASK_LIMITS } from "../domain/task";

export const createTaskRequestSchema = z.strictObject({
  title: z.string().trim().min(1).max(TASK_LIMITS.title),
  description: z.string().trim().max(TASK_LIMITS.description).optional(),
});

export const taskDtoSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(TASK_LIMITS.title),
  description: z.string().trim().max(TASK_LIMITS.description).optional(),
  createdAt: z.iso.datetime(),
});

export const taskListResponseSchema = z.object({
  data: z.array(taskDtoSchema),
});
export const taskResponseSchema = z.object({ data: taskDtoSchema });
export type TaskDto = z.infer<typeof taskDtoSchema>;
