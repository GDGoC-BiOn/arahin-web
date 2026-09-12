import axios from "axios";
import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      return new ApiError(
        "The request timed out. Please try again.",
        "TIMEOUT",
      );
    }
    const parsed = apiErrorSchema.safeParse(error.response?.data);
    if (parsed.success) {
      const { message, code, fields } = parsed.data.error;
      return new ApiError(message, code, error.response?.status, fields);
    }
    if (!error.response)
      return new ApiError(
        "We couldn’t connect. Check your connection and try again.",
        "NETWORK_ERROR",
      );
    return new ApiError(
      "Something went wrong. Please try again.",
      "HTTP_ERROR",
      error.response.status,
    );
  }
  return new ApiError(
    "Something went wrong. Please try again.",
    "UNKNOWN_ERROR",
  );
}
