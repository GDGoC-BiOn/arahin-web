import { ingestionHandlers } from "@/features/ingestion/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ sourceId: string; imageId: string }> },
) {
  const { sourceId, imageId } = await context.params;
  return ingestionHandlers.sourceImage(request, sourceId, imageId);
}
