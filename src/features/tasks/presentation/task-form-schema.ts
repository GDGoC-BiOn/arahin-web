import { z } from "zod";
import { TASK_LIMITS } from "../domain/task";

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give your task a title.")
    .max(TASK_LIMITS.title, "Keep the title to 60 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(
      TASK_LIMITS.description,
      "Keep the description to 240 characters or fewer.",
    ),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
