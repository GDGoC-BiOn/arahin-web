import { ingestionHandlers } from "@/features/ingestion/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ quizId: string }> },
) {
  const { quizId } = await context.params;
  return ingestionHandlers.quiz(request, quizId);
}
