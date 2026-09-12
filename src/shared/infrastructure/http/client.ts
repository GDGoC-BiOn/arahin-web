import axios from "axios";
import { normalizeApiError } from "./api-error";

export function createHttpClient() {
  const client = axios.create({
    baseURL: "/api",
    timeout: 10_000,
    transitional: { clarifyTimeoutError: true },
    headers: { Accept: "application/json" },
  });
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(normalizeApiError(error)),
  );
  return client;
}

export const httpClient = createHttpClient();
