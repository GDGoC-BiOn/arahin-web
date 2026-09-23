"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState, useTransition } from "react";
import { authErrorMessage } from "./auth-messages";

type ApiLikeError = { code?: unknown; message?: unknown };

function toMessage(error: unknown): string {
  const candidate = error as ApiLikeError | null;
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const message =
    typeof candidate?.message === "string" && candidate.message
      ? candidate.message
      : "Terjadi kesalahan. Coba lagi.";
  return authErrorMessage(code, message);
}

/**
 * Forms own client input state through React Hook Form. The request itself is
 * server state, so React Query owns its mutation lifecycle.
 *
 * Pending remains true through the route hand-off so the submit button never
 * flicks back to idle between a successful request and the next page.
 */
export function useAuthSubmit<TValues>(options: {
  action: (values: TValues) => Promise<unknown>;
  onSuccess: () => void;
}) {
  const { action, onSuccess } = options;
  const [handedOff, setHandedOff] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const inFlight = useRef(false);

  const mutation = useMutation({
    mutationFn: action,
  });

  const submit = useCallback(
    async (values: TValues) => {
      if (inFlight.current) return;
      inFlight.current = true;
      mutation.reset();

      try {
        await mutation.mutateAsync(values);
        setHandedOff(true);
        startNavigation(() => {
          onSuccess();
        });
      } catch {
        inFlight.current = false;
      }
    },
    [mutation, onSuccess],
  );

  return {
    submit,
    error: mutation.error ? toMessage(mutation.error) : null,
    clearError: mutation.reset,
    pending: mutation.isPending || handedOff || isNavigating,
  };
}
