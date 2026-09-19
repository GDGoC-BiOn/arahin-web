import { readSessionToken } from "../session/session-cookie";
import { ApiError } from "./api-error";
import { callBackend } from "./arahin-backend";

/**
 * The one-line authenticated passthrough most `/api/me/*` routes need: attach
 * the cookie's token, forward an optional JSON body, and hand back the
 * backend's JSON or its error envelope unchanged.
 */
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

export async function proxyBackendJson(
  request: Request,
  target: { path: string; method: "GET" | "POST" | "PATCH"; body?: boolean },
): Promise<Response> {
  const token = readSessionToken(request);
  if (!token) {
    return Response.json(
      {
        error: {
          code: "UNAUTHORIZED_GUEST",
          message: "Sesi berakhir. Silakan masuk lagi.",
        },
      },
      { status: 401, headers: JSON_HEADERS },
    );
  }
  try {
    let body: unknown;
    if (target.body) {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }
    const data = await callBackend<unknown>({
      path: target.path,
      method: target.method,
      body,
      token,
    });
    return Response.json(data ?? {}, { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    const api =
      error instanceof ApiError
        ? error
        : new ApiError("Terjadi kesalahan. Coba lagi.", "INTERNAL", 500);
    return Response.json(
      { error: { code: api.code, message: api.message, fields: api.fields } },
      { status: api.status ?? 500, headers: JSON_HEADERS },
    );
  }
}
