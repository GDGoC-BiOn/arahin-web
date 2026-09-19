"use client";

import { useRouter } from "next/navigation";
import { httpClient } from "@/shared/infrastructure/http/client";
import { createIngestionUseCases } from "./application/ingestion-use-cases";
import { createBrowserIngestionGateway } from "./infrastructure/browser-ingestion-gateway";
import { createLocalGenerationCheckpointStore } from "./infrastructure/local-generation-checkpoint-store";
import { HomeScreen } from "./presentation/home-screen";

const useCases = createIngestionUseCases(
  createBrowserIngestionGateway(httpClient),
  { checkpoint: createLocalGenerationCheckpointStore() },
);

export function HomeFeature({ greetingName }: { greetingName: string }) {
  const router = useRouter();
  return (
    <HomeScreen
      useCases={useCases}
      greetingName={greetingName}
      // The space detail and the Journey/Profil tabs are not built yet; the
      // routes are named now so the wiring is real once those screens land.
      onOpenSpace={(spaceId) => router.push(`/ruang/${spaceId}`)}
      onSignIn={() => router.push("/masuk")}
      onReview={(review) =>
        router.push(`/sesi/${review.lessonId}/kuis?ruang=${review.spaceId}`)
      }
      onSelectTab={(tab) => {
        if (tab === "journey") router.push("/journey");
        if (tab === "profile") router.push("/profil");
      }}
    />
  );
}
