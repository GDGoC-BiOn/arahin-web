"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { httpClient } from "@/shared/infrastructure/http/client";
import { createProfileUseCases } from "./application/profile-use-cases";
import { createBrowserProfileGateway } from "./infrastructure/browser-profile-gateway";
import { EditProfileScreen } from "./presentation/edit-profile-screen";
import { NotificationsScreen } from "./presentation/notifications-screen";
import { ProfileScreen } from "./presentation/profile-screen";

const useCases = createProfileUseCases(createBrowserProfileGateway(httpClient));

export function NotificationsFeature() {
  const router = useRouter();
  return (
    <NotificationsScreen
      useCases={useCases}
      onBack={() => router.push("/profil")}
    />
  );
}

export function EditProfileFeature() {
  const router = useRouter();
  return (
    <EditProfileScreen
      useCases={useCases}
      onBack={() => router.push("/profil")}
      onSaved={() => {
        router.push("/profil");
        router.refresh();
      }}
    />
  );
}

export function ProfileFeature({
  fallbackName,
  signOutSlot,
}: {
  fallbackName: string;
  signOutSlot: ReactNode;
}) {
  const router = useRouter();
  return (
    <ProfileScreen
      useCases={useCases}
      fallbackName={fallbackName}
      signOutSlot={signOutSlot}
      onBack={() => router.push("/beranda")}
      onEditProfile={() => router.push("/profil/edit")}
      onOpenNotifications={() => router.push("/profil/notifikasi")}
      onSelectTab={(tab) => {
        if (tab === "home") router.push("/beranda");
        if (tab === "journey") router.push("/journey");
      }}
    />
  );
}
