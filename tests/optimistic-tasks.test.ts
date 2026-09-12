import { describe, expect, it } from "vitest";
import type { Task } from "@/features/tasks/domain/task";
import {
  insertOptimistic,
  reconcileTask,
  rollbackTasks,
} from "@/features/tasks/presentation/optimistic-tasks";

const existing: Task = {
  id: "existing",
  title: "Existing",
  createdAt: new Date(0),
};
const temporary: Task = {
  id: "pending-1",
  title: "New",
  createdAt: new Date(1),
};
const saved: Task = { ...temporary, id: "server-id", createdAt: new Date(2) };
describe("optimistic cache transitions", () => {
  it("prepends without mutating the exact snapshot", () => {
    const snapshot = [existing];
    expect(insertOptimistic(snapshot, temporary)).toEqual([
      temporary,
      existing,
    ]);
    expect(snapshot).toEqual([existing]);
    expect(insertOptimistic(undefined, temporary)).toEqual([temporary]);
  });
  it("replaces in place with the server ID and timestamp", () => {
    const current = [existing, temporary];
    expect(reconcileTask(current, temporary.id, saved)).toEqual([
      existing,
      saved,
    ]);
    expect(current[1]).toBe(temporary);
  });
  it("retains a successful creation if the cache was removed", () => {
    expect(reconcileTask(undefined, temporary.id, saved)).toEqual([saved]);
  });
  it("restores the exact snapshot, including empty and absent caches", () => {
    const snapshot = [existing];
    expect(rollbackTasks(snapshot)).toBe(snapshot);
    const empty: Task[] = [];
    expect(rollbackTasks(empty)).toBe(empty);
    expect(rollbackTasks(undefined)).toBeUndefined();
  });
});
