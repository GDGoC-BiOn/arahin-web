import type { OnboardingCompletionStore } from "../domain/onboarding-completion-store";
import {
  ONBOARDING_SLIDES,
  type OnboardingDeck,
} from "../domain/onboarding-slide";

export function createOnboardingUseCases(store: OnboardingCompletionStore) {
  return {
    getSlides(): OnboardingDeck {
      return ONBOARDING_SLIDES;
    },
    hasCompleted(): boolean {
      return store.hasCompleted();
    },
    markCompleted(): void {
      store.markCompleted();
    },
  };
}

export type OnboardingUseCases = ReturnType<typeof createOnboardingUseCases>;
