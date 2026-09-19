import "server-only";
import { ApiError } from "@/shared/infrastructure/http/api-error";
import { callBackend } from "@/shared/infrastructure/http/arahin-backend";
import { readSessionToken } from "@/shared/infrastructure/session/session-cookie";
import type { SpaceSummary } from "./domain/learning-space";
import { ingestionHandlers } from "./infrastructure/ingestion-handlers";

export { ingestionHandlers };

/**
 * Server-side space list, used to resolve the Journey tab to a real space
 * rather than leaving it pointing at nothing. Returns [] for any auth failure
 * so callers only deal with "has spaces" or "doesn't".
 */
export async function listSpacesFromCookie(
  cookieHeader: string | null,
): Promise<SpaceSummary[]> {
  const request = new Request("http://internal/", {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  const token = readSessionToken(request);
  if (!token) return [];
  try {
    const data = await callBackend<{ learningSpaces: SpaceSummary[] }>({
      path: "/v1/spaces",
      method: "GET",
      token,
    });
    return data.learningSpaces ?? [];
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return [];
    throw error;
  }
}
