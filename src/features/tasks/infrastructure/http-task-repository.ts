import type { AxiosInstance } from "axios";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import type { TaskRepository } from "../domain/task-repository";
import { toTask } from "./task-mapper";
import { taskListResponseSchema, taskResponseSchema } from "./task-schemas";

export function createHttpTaskRepository(
  client: AxiosInstance,
): TaskRepository {
  return {
    async list() {
      const response = await client.get<unknown>("/tasks");
      const parsed = taskListResponseSchema.safeParse(response.data);
      if (!parsed.success)
        throw new ApiError(
          "The server returned an invalid task list. Please try again.",
          "INVALID_RESPONSE",
        );
      return parsed.data.data.map(toTask);
    },
    async create(input) {
      const response = await client.post<unknown>("/tasks", input);
      const parsed = taskResponseSchema.safeParse(response.data);
      if (!parsed.success)
        throw new ApiError(
          "The server returned an invalid task. Reload to check whether it was saved.",
          "INVALID_RESPONSE",
        );
      return toTask(parsed.data.data);
    },
  };
}
