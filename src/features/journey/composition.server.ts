import "server-only";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { callBackend } from "@/shared/infrastructure/http/arahin-backend";
import { proxyBackendJson } from "@/shared/infrastructure/http/backend-json-proxy";
import { readSessionToken } from "@/shared/infrastructure/session/session-cookie";

export type LessonDetail = {
  id: string;
  trackId: string;
  title: string;
  contentMarkdown: string;
  quizzes: {
    id: string;
    title: string;
    passingScore: number;
    itemCount: number;
  }[];
};

/**
 * Resolves a lesson server-side so the session route can find its quiz without
 * the quiz feature having to know anything about lessons — the layer rules
 * forbid it reaching into journey.
 */
export async function lessonFromCookie(
  cookieHeader: string | null,
  lessonId: string,
): Promise<LessonDetail | null> {
  const request = new Request("http://internal/", {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  const token = readSessionToken(request);
  if (!token) return null;
  try {
    const lesson = await callBackend<LessonDetail>({
      path: `/v1/lessons/${encodeURIComponent(lessonId)}`,
      method: "GET",
      token,
    });
    return { ...lesson, quizzes: lesson.quizzes ?? [] };
  } catch (error) {
    // 404 conflates "unknown", "someone else's" and "not generated yet";
    // 400 is a malformed id typed into the URL. All read as "not found".
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 401 || error.status === 400)
    ) {
      return null;
    }
    throw error;
  }
}

export type SpaceHeader = { id: string; title: string; sourceType: string };

/**
 * A space the signed-in user owns, or null when the id is malformed, unknown
 * or someone else's — the backend answers all three the same way on purpose.
 */
export async function spaceFromCookie(
  cookieHeader: string | null,
  spaceId: string,
): Promise<SpaceHeader | null> {
  const request = new Request("http://internal/", {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  const token = readSessionToken(request);
  if (!token) return null;
  try {
    return await callBackend<SpaceHeader>({
      path: `/v1/spaces/${encodeURIComponent(spaceId)}`,
      method: "GET",
      token,
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 401 || error.status === 400)
    ) {
      return null;
    }
    throw error;
  }
}

export type LessonActivity = {
  activityId: string;
  title: string;
  items: {
    id: string;
    question: string;
    options: { id: string; label: string }[];
  }[];
};

type JourneyLessons = {
  lessons?: {
    id: string;
    activities?: {
      id: string;
      kind: string;
      title: string;
      orderIndex: number;
      items?: LessonActivity["items"];
    }[];
  }[];
};

const GRADED_KINDS = new Set(["quiz", "practice", "challenge"]);

/**
 * The lesson's first graded Activity, found through the space's journey. null
 * whenever anything along the way is missing, so the caller can fall back to
 * the legacy micro-quiz.
 */
export async function lessonActivityFromCookie(
  cookieHeader: string | null,
  spaceId: string,
  lessonId: string,
): Promise<LessonActivity | null> {
  const request = new Request("http://internal/", {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  const token = readSessionToken(request);
  if (!token) return null;
  try {
    const { journeys } = await callBackend<{ journeys?: { id: string }[] }>({
      path: `/v1/spaces/${encodeURIComponent(spaceId)}/journeys`,
      method: "GET",
      token,
    });
    for (const journey of journeys ?? []) {
      const detail = await callBackend<JourneyLessons>({
        path: `/v1/journeys/${encodeURIComponent(journey.id)}/lessons`,
        method: "GET",
        token,
      });
      const lesson = detail.lessons?.find((entry) => entry.id === lessonId);
      const activity = lesson?.activities
        ?.filter((entry) => GRADED_KINDS.has(entry.kind) && entry.items?.length)
        .sort((a, b) => a.orderIndex - b.orderIndex)[0];
      if (activity) {
        return {
          activityId: activity.id,
          title: activity.title,
          items: activity.items ?? [],
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export const journeyHandlers = {
  journeys: (request: Request, spaceId: string) =>
    proxyBackendJson(request, {
      path: `/v1/spaces/${encodeURIComponent(spaceId)}/journeys`,
      method: "GET",
    }),
};
