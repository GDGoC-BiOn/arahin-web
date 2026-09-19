import { journeyHandlers } from "@/features/journey/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ spaceId: string }> },
) {
  const { spaceId } = await context.params;
  return journeyHandlers.journeys(request, spaceId);
}
