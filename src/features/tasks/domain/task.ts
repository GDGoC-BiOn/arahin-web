export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export const TASK_LIMITS = { title: 60, description: 240 } as const;

export class TaskValidationError extends Error {
  constructor(
    public readonly fields: Partial<Record<keyof CreateTaskInput, string[]>>,
  ) {
    super("Please check your task details.");
    this.name = "TaskValidationError";
  }
}

export function normalizeTaskInput(input: CreateTaskInput): CreateTaskInput {
  const title = input.title.trim();
  const description = input.description?.trim();
  const fields: TaskValidationError["fields"] = {};
  if (!title || title.length > TASK_LIMITS.title) {
    fields.title = ["Use a title between 1 and 60 characters."];
  }
  if (description && description.length > TASK_LIMITS.description) {
    fields.description = ["Keep the description to 240 characters or fewer."];
  }
  if (Object.keys(fields).length) throw new TaskValidationError(fields);
  return { title, ...(description ? { description } : {}) };
}
