import { quizHandlers } from "@/features/quiz/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string; activityId: string }> },
) {
  const { lessonId, activityId } = await context.params;
  return quizHandlers.submitActivity(request, lessonId, activityId);
}
