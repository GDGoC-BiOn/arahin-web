import { ingestionHandlers } from "@/features/ingestion/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 190;

export async function POST(
  request: Request,
  context: { params: Promise<{ spaceId: string }> },
) {
  const { spaceId } = await context.params;
  return ingestionHandlers.generateBlueprint(request, spaceId);
}
