import { ingestionHandlers } from "@/features/ingestion/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ spaceId: string; generationId: string }> },
) {
  const { spaceId, generationId } = await context.params;
  return ingestionHandlers.getBlueprintGeneration(
    request,
    spaceId,
    generationId,
  );
}
