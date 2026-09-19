"use client";

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
 * Keeps the submit -> result -> navigate sequence continuous. `pending` stays
 * true across both the request and the route change, so the button never
 * flicks back to its resting label in the gap between a successful sign-in
 * and the next screen appearing.
 */
export function useAuthSubmit<TValues>(options: {
  action: (values: TValues) => Promise<unknown>;
  onSuccess: () => void;
}) {
  const { action, onSuccess } = options;
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [handedOff, setHandedOff] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const inFlight = useRef(false);

  const submit = useCallback(
    async (values: TValues) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setError(null);
      setSubmitting(true);
      try {
        await action(values);
        // Deliberately no setSubmitting(false) on success: the pending state
        // must hold until the next screen takes over.
        setHandedOff(true);
        startNavigation(() => {
          onSuccess();
        });
      } catch (cause) {
        setError(toMessage(cause));
        setSubmitting(false);
        inFlight.current = false;
      }
    },
    [action, onSuccess],
  );

  return {
    submit,
    error,
    clearError: useCallback(() => setError(null), []),
    pending: submitting || handedOff || isNavigating,
  };
}
