import { profileHandlers } from "@/features/profile/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = profileHandlers.subscription;
