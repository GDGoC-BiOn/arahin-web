import { authHandlers } from "@/features/auth/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = authHandlers.googleCallback;
