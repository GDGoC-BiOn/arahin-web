"use client";

import { useRouter } from "next/navigation";
import { createOnboardingUseCases } from "./application/onboarding-use-cases";
import { createLocalOnboardingCompletionStore } from "./infrastructure/local-onboarding-completion-store";
import { OnboardingScreen } from "./presentation/onboarding-screen";

const useCases = createOnboardingUseCases(
  createLocalOnboardingCompletionStore(),
);

export function OnboardingFeature() {
  const router = useRouter();
  return (
    <OnboardingScreen
      useCases={useCases}
      onFinish={() => router.push("/daftar")}
      onLogin={() => router.push("/masuk")}
    />
  );
}
