import {
  lessonActivityFromCookie,
  lessonFromCookie,
} from "@/features/journey/composition.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ spaceId: string; lessonId: string }>;
  },
) {
  const { spaceId, lessonId } = await context.params;
  const cookie = request.headers.get("cookie");

  const [lesson, activity] = await Promise.all([
    lessonFromCookie(cookie, lessonId),
    lessonActivityFromCookie(cookie, spaceId, lessonId),
  ]);

  if (!lesson) {
    return Response.json({ error: "Lesson not found." }, { status: 404 });
  }

  if (activity) {
    return Response.json({
      source: {
        kind: "activity",
        lessonId: lesson.id,
        activityId: activity.activityId,
      },
      quiz: {
        id: activity.activityId,
        lessonId: lesson.id,
        title: activity.title,
        passingScore: 0,
        itemCount: activity.items.length,
        items: activity.items.map((item, index) => ({
          ...item,
          orderIndex: index + 1,
        })),
      },
    });
  }

  const quiz = lesson.quizzes[0];
  if (!quiz) {
    return Response.json(
      { error: "This lesson has no generated quiz yet." },
      { status: 404 },
    );
  }

  return Response.json({
    source: { kind: "quiz", quizId: quiz.id },
    quiz: null,
  });
}
