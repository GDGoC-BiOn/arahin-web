import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskUseCases } from "../application/task-use-cases";
import type { Task } from "../domain/task";
import {
  insertOptimistic,
  reconcileTask,
  rollbackTasks,
} from "./optimistic-tasks";

export const taskQueryKey = ["tasks"] as const;
export function useTasks(useCases: TaskUseCases) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: useCases.create,
    // Fail promptly offline so rollback preserves input for retry.
    networkMode: "always",
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: taskQueryKey });
      const snapshot = client.getQueryData<Task[]>(taskQueryKey);
      const temporaryId = `pending-${crypto.randomUUID()}`;
      client.setQueryData(
        taskQueryKey,
        insertOptimistic(snapshot, {
          ...input,
          id: temporaryId,
          createdAt: new Date(),
        }),
      );
      return { snapshot, temporaryId };
    },
    onSuccess: (saved, _input, context) => {
      client.setQueryData<Task[]>(taskQueryKey, (tasks) =>
        reconcileTask(tasks, context.temporaryId, saved),
      );
      // An early submission only knows its own row; load the rest afterward.
      if (context.snapshot === undefined) {
        void client.invalidateQueries({
          queryKey: taskQueryKey,
          refetchType: "none",
        });
      }
    },
    onError: (_error, _input, context) => {
      if (!context) return;
      const snapshot = rollbackTasks(context.snapshot);
      // setQueryData(undefined) is a no-op; restore missing data explicitly.
      if (snapshot === undefined)
        client.removeQueries({ queryKey: taskQueryKey, exact: true });
      else client.setQueryData(taskQueryKey, snapshot);
    },
  });
  const query = useQuery({
    queryKey: taskQueryKey,
    queryFn: useCases.list,
    enabled: !mutation.isPending,
  });
  return { query, mutation };
}
