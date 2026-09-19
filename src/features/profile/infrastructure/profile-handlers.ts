import { proxyBackendJson } from "@/shared/infrastructure/http/backend-json-proxy";

export const profileHandlers = {
  getProfile: (request: Request) =>
    proxyBackendJson(request, { path: "/v1/me", method: "GET" }),
  updateProfile: (request: Request) =>
    proxyBackendJson(request, { path: "/v1/me", method: "PATCH", body: true }),
  streak: (request: Request) => {
    const days = new URL(request.url).searchParams.get("days") ?? "7";
    return proxyBackendJson(request, {
      path: `/v1/me/streak?days=${encodeURIComponent(days)}`,
      method: "GET",
    });
  },
  notifications: (request: Request) =>
    proxyBackendJson(request, { path: "/v1/me/notifications", method: "GET" }),
  markNotificationRead: (request: Request, notificationId: string) =>
    proxyBackendJson(request, {
      path: `/v1/me/notifications/${encodeURIComponent(notificationId)}/read`,
      method: "PATCH",
    }),
  subscription: (request: Request) =>
    proxyBackendJson(request, { path: "/v1/me/subscription", method: "GET" }),
};
