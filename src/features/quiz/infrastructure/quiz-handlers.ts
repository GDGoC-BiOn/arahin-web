import { proxyBackendJson } from "@/shared/infrastructure/http/backend-json-proxy";

export const quizHandlers = {
  submitActivity: (request: Request, lessonId: string, activityId: string) =>
    proxyBackendJson(request, {
      path: `/v1/lessons/${encodeURIComponent(lessonId)}/activities/${encodeURIComponent(activityId)}/submit`,
      method: "POST",
      body: true,
    }),
};
