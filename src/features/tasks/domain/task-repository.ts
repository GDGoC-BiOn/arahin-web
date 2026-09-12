import type { CreateTaskInput, Task } from "./task";

export interface TaskRepository {
  list(): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
}
