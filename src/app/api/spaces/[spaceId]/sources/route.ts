import { ingestionHandlers } from "@/features/ingestion/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The body is streamed to the backend rather than buffered, so the platform
// must not try to parse or size-limit it here.
export const maxDuration = 180;

export async function POST(
  request: Request,
  context: { params: Promise<{ spaceId: string }> },
) {
  const { spaceId } = await context.params;
  return ingestionHandlers.uploadSource(request, spaceId);
}
