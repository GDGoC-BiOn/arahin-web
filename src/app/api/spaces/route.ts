import { ingestionHandlers } from "@/features/ingestion/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = ingestionHandlers.createSpace;
export const GET = ingestionHandlers.listSpaces;
