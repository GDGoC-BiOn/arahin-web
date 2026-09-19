"use client";

import { useRouter } from "next/navigation";
import { httpClient } from "@/shared/infrastructure/http/client";
import { createJourneyUseCases } from "./application/journey-use-cases";
import { createBrowserJourneyGateway } from "./infrastructure/browser-journey-gateway";
import { JourneyScreen } from "./presentation/journey-screen";

const useCases = createJourneyUseCases(createBrowserJourneyGateway(httpClient));

export function JourneyFeature({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  return (
    <JourneyScreen
      useCases={useCases}
      spaceId={spaceId}
      onBack={() => router.push("/beranda")}
      // The space rides along so the session can get back to this timeline
      // without another lookup.
      onOpenSession={(session) =>
        router.push(`/sesi/${session.id}?ruang=${spaceId}`)
      }
      onSelectTab={(tab) => {
        if (tab === "home") router.push("/beranda");
        if (tab === "profile") router.push("/profil");
      }}
    />
  );
}
