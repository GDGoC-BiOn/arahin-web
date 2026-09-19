import { ApiError } from "@/shared/infrastructure/http/api-error";
import {
  BACKEND_TIMEOUTS,
  callBackend,
  fetchBackendRaw,
  streamToBackend,
} from "@/shared/infrastructure/http/arahin-backend";
import { proxyBackendJson } from "@/shared/infrastructure/http/backend-json-proxy";
import { readSessionToken } from "@/shared/infrastructure/session/session-cookie";

/**
 * Proxy handlers for the ingestion flow. Same reasons as the auth proxy: the
 * Go backend registers no CORS, and keeping the JWT in an httpOnly cookie
 * means only the server can attach it.
 */
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

function errorResponse(error: unknown): Response {
  const api =
    error instanceof ApiError
      ? error
      : new ApiError("Terjadi kesalahan. Coba lagi.", "INTERNAL", 500);
  return Response.json(
    { error: { code: api.code, message: api.message } },
    { status: api.status ?? 500, headers: JSON_HEADERS },
  );
}

function unauthorized(): Response {
  return Response.json(
    {
      error: {
        code: "UNAUTHORIZED_GUEST",
        message:
          "Session locked. Silakan login atau register untuk mengakses modul ini.",
      },
    },
    { status: 401, headers: JSON_HEADERS },
  );
}

async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const parsed: unknown = await request.json();
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

const asString = (value: unknown) => (typeof value === "string" ? value : "");

export const ingestionHandlers = {
  async createSpace(request: Request): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const body = await readJsonBody(request);
      const created = await callBackend<unknown>({
        path: "/v1/spaces",
        method: "POST",
        token,
        body: {
          title: asString(body.title),
          description: asString(body.description),
          sourceType: asString(body.sourceType),
        },
      });
      return Response.json(created, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  /**
   * Streams the multipart body straight through, so a 25 MiB upload is never
   * buffered here and the browser's byte-level progress stays truthful.
   */
  async uploadSource(request: Request, spaceId: string): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return Response.json(
        {
          error: {
            code: "NO_FILE",
            message: "expected a multipart field named 'file'",
          },
        },
        { status: 400, headers: JSON_HEADERS },
      );
    }
    if (!request.body) {
      return Response.json(
        { error: { code: "NO_FILE", message: "request had no body" } },
        { status: 400, headers: JSON_HEADERS },
      );
    }
    try {
      const uploaded = await streamToBackend<unknown>({
        path: `/v1/spaces/${encodeURIComponent(spaceId)}/sources`,
        body: request.body,
        contentType,
        token,
        timeoutMs: BACKEND_TIMEOUTS.upload,
      });
      return Response.json(uploaded, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  async generateBlueprint(
    request: Request,
    spaceId: string,
  ): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const generated = await callBackend<unknown>({
        path: `/v1/spaces/${encodeURIComponent(spaceId)}/blueprint`,
        method: "POST",
        token,
        timeoutMs: BACKEND_TIMEOUTS.blueprint,
      });
      return Response.json(generated, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  async startBlueprintGeneration(
    request: Request,
    spaceId: string,
  ): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const job = await callBackend<unknown>({
        path: `/v1/spaces/${encodeURIComponent(spaceId)}/blueprint/generations`,
        method: "POST",
        token,
      });
      return Response.json(job, { status: 202, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  async getBlueprintGeneration(
    request: Request,
    spaceId: string,
    generationId: string,
  ): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const job = await callBackend<unknown>({
        path: `/v1/spaces/${encodeURIComponent(spaceId)}/blueprint/generations/${encodeURIComponent(generationId)}`,
        method: "GET",
        token,
      });
      return Response.json(job, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  async listTracks(request: Request, spaceId: string): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const tracks = await callBackend<unknown>({
        path: `/v1/spaces/${encodeURIComponent(spaceId)}/tracks`,
        method: "GET",
        token,
      });
      return Response.json(tracks, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  async lesson(request: Request, lessonId: string): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const lesson = await callBackend<unknown>({
        path: `/v1/lessons/${encodeURIComponent(lessonId)}`,
        method: "GET",
        token,
      });
      return Response.json(lesson, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  async quiz(request: Request, quizId: string): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const quiz = await callBackend<unknown>({
        path: `/v1/quizzes/${encodeURIComponent(quizId)}`,
        method: "GET",
        token,
      });
      return Response.json(quiz, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  /**
   * Grading happens entirely server-side — the answer key never reaches the
   * browser — so this forwards the answers untouched and returns whatever the
   * backend decided.
   */
  async submitAttempt(request: Request): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const body = await readJsonBody(request);
      const result = await callBackend<unknown>({
        path: "/v1/quiz-attempts",
        method: "POST",
        token,
        body: { quizId: asString(body.quizId), answers: body.answers ?? [] },
      });
      return Response.json(result, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  /**
   * Lesson markdown embeds `/v1/sources/{id}/images/{id}`, which the backend
   * serves only to a request carrying a bearer token — something an `<img>`
   * tag cannot send. Streaming it through here is what stops every figure in
   * a lesson from rendering broken.
   */
  async sourceImage(
    request: Request,
    sourceId: string,
    imageId: string,
  ): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const upstream = await fetchBackendRaw({
        path: `/v1/sources/${encodeURIComponent(sourceId)}/images/${encodeURIComponent(imageId)}`,
        token,
      });
      if (!upstream.ok || !upstream.body) {
        return Response.json(
          { error: { code: "NOT_FOUND", message: "image not found" } },
          { status: upstream.status, headers: JSON_HEADERS },
        );
      }
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ?? "application/octet-stream",
          // The backend calls these immutable; the bytes never change.
          "Cache-Control": "private, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      return errorResponse(error);
    }
  },

  /**
   * The lesson rendered as a PDF or PPTX file by the backend. A download link
   * cannot carry a bearer token, so the bytes stream through here.
   */
  async lessonDocument(
    request: Request,
    lessonId: string,
    format: "pdf" | "ppt",
  ): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const upstream = await fetchBackendRaw({
        path: `/v1/lessons/${encodeURIComponent(lessonId)}/${format}`,
        token,
      });
      if (!upstream.ok || !upstream.body) {
        return Response.json(
          { error: { code: "NOT_FOUND", message: "document not found" } },
          { status: upstream.status, headers: JSON_HEADERS },
        );
      }
      const headers = new Headers({
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
      });
      const disposition = upstream.headers.get("content-disposition");
      if (disposition) headers.set("Content-Disposition", disposition);
      return new Response(upstream.body, { status: 200, headers });
    } catch (error) {
      return errorResponse(error);
    }
  },

  dueReviews: (request: Request) =>
    proxyBackendJson(request, { path: "/v1/reviews/active", method: "GET" }),

  async listSpaces(request: Request): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      // Search is the backend's: it matches titles and descriptions itself.
      const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
      const spaces = await callBackend<unknown>({
        path: q ? `/v1/spaces?q=${encodeURIComponent(q)}` : "/v1/spaces",
        method: "GET",
        token,
      });
      return Response.json(spaces, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },

  async listProgress(request: Request): Promise<Response> {
    const token = readSessionToken(request);
    if (!token) return unauthorized();
    try {
      const progress = await callBackend<unknown>({
        path: "/v1/me/progress",
        method: "GET",
        token,
      });
      return Response.json(progress, { status: 200, headers: JSON_HEADERS });
    } catch (error) {
      return errorResponse(error);
    }
  },
};
