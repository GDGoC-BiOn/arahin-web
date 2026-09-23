"use client";

import { workshopApi } from "./infrastructure/workshop-api";
import { WorkshopStarter } from "./presentation/workshop-starter";

export function WorkshopFeature() {
  return <WorkshopStarter api={workshopApi} />;
}
