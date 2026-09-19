import { ApiError, apiErrorSchema } from "./api-error";

/**
 * Server-side client for the Go backend. It runs only inside route handlers
 * and server components: the browser never reaches :8080 directly, because
 * the backend ships no CORS middleware at all.
 */
const DEFAULT_BASE_URL = "http://localhost:8080";

function baseUrl(): string {
  return (process.env.ARAHIN_API_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}

/**
 * Timeouts sized to what each backend step actually does. The Go router's own
 * timeout is PARSER_TIMEOUT + 15s (165s by default), and blueprint generation
 * calls out to the AI service, so anything shorter here would abort a request
 * the backend is still legitimately working on.
 */
export const BACKEND_TIMEOUTS = {
  /** Auth and small reads. */
  quick: 15_000,
  /** Upload + synchronous parse of a document. */
  upload: 170_000,
  /** Blueprint generation (AI, with retries). */
  blueprint: 180_000,
} as const;

export type BackendRequest = {
  path: string;
  method: "GET" | "POST" | "PATCH";
  body?: unknown;
  token?: string | null;
  /** Uploads and blueprint generation need far longer than a login. */
  timeoutMs?: number;
};

export async function callBackend<T>(request: BackendRequest): Promise<T> {
  const {
    path,
    method,
    body,
    token,
    timeoutMs = BACKEND_TIMEOUTS.quick,
  } = request;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // The backend parses this with a literal `CutPrefix(h, "Bearer ")`:
  // exactly one space, case-sensitive, no cookie or query fallback.
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(
        "Server terlalu lama merespons. Coba lagi.",
        "TIMEOUT",
      );
    }
    throw new ApiError(
      "Tidak bisa menghubungi server. Periksa koneksi kamu.",
      "NETWORK_ERROR",
    );
  }

  // 204 on logout, and any other body-less success.
  return readBackendResponse<T>(response);
}

/**
 * Streams a multipart upload straight through to the backend. The body is
 * forwarded as received rather than buffered, so a 25 MiB PDF never has to sit
 * in this process's memory, and the browser's own upload progress stays
 * meaningful all the way to the wire.
 */
export async function streamToBackend<T>(request: {
  path: string;
  body: BodyInit;
  contentType: string;
  token?: string | null;
  timeoutMs?: number;
}): Promise<T> {
  const {
    path,
    body,
    contentType,
    token,
    timeoutMs = BACKEND_TIMEOUTS.upload,
  } = request;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": contentType,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      // Required by undici whenever a stream is used as the body.
      duplex: "half",
    } as RequestInit & { duplex: "half" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(
        "Pemrosesan file melebihi batas waktu. Coba file yang lebih kecil.",
        "TIMEOUT",
      );
    }
    throw new ApiError(
      "Tidak bisa menghubungi server. Periksa koneksi kamu.",
      "NETWORK_ERROR",
    );
  }

  return readBackendResponse<T>(response);
}

/**
 * For endpoints that answer with bytes rather than JSON. The caller owns the
 * response, so the body can be streamed straight through without buffering.
 */
export async function fetchBackendRaw(request: {
  path: string;
  token?: string | null;
  timeoutMs?: number;
  /** Extra request headers, e.g. a forwarded cookie. */
  headers?: Record<string, string>;
  /** "manual" to hand a backend redirect back to the caller untouched. */
  redirect?: RequestRedirect;
}): Promise<Response> {
  const { path, token, timeoutMs = BACKEND_TIMEOUTS.quick } = request;
  const headers: Record<string, string> = { ...request.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(`${baseUrl()}${path}`, {
      headers,
      redirect: request.redirect,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError(
      "Tidak bisa menghubungi server. Periksa koneksi kamu.",
      "NETWORK_ERROR",
    );
  }
}

async function readBackendResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const raw = await response.text();
  const payload: unknown = raw ? safeJson(raw) : undefined;
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(payload);
    if (parsed.success) {
      throw new ApiError(
        parsed.data.error.message,
        parsed.data.error.code,
        response.status,
      );
    }
    throw new ApiError(
      "Terjadi kesalahan di server. Coba lagi.",
      "HTTP_ERROR",
      response.status,
    );
  }
  return payload as T;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
