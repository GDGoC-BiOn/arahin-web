import type { OnboardingCompletionStore } from "../domain/onboarding-completion-store";

const STORAGE_KEY = "arahin.onboarding.completed";

/**
 * Every access is guarded: private browsing and blocked site data make
 * localStorage throw on read as well as write. Failing open (treat as
 * "not completed", let navigation continue) keeps a storage error from
 * stranding the user on the last slide.
 */
export function createLocalOnboardingCompletionStore(): OnboardingCompletionStore {
  return {
    hasCompleted() {
      try {
        return globalThis.localStorage?.getItem(STORAGE_KEY) === "true";
      } catch {
        return false;
      }
    },
    markCompleted() {
      try {
        globalThis.localStorage?.setItem(STORAGE_KEY, "true");
      } catch {
        // Progress is a convenience, not a gate. Swallow and move on.
      }
    },
  };
}
