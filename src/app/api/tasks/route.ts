import { taskHandlers } from "@/features/tasks/composition.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = taskHandlers.GET;
export const POST = taskHandlers.POST;
