import MockAdapter from "axios-mock-adapter";
import { afterEach, describe, expect, it } from "vitest";
import { createHttpTaskRepository } from "@/features/tasks/infrastructure/http-task-repository";
import {
  ApiError,
  normalizeApiError,
} from "@/shared/infrastructure/http/api-error";
import { createHttpClient } from "@/shared/infrastructure/http/client";

const dto = {
  id: "e0f12cc5-0396-4317-b88e-dbeebea21bd4",
  title: "Plan",
  createdAt: "2026-09-12T10:00:00.000Z",
};
const client = createHttpClient();
const mock = new MockAdapter(client);
const repository = createHttpTaskRepository(client);
afterEach(() => mock.reset());

describe("Axios adapter", () => {
  it("uses a same-origin API with clarified 10-second timeouts", () => {
    expect(client.defaults.baseURL).toBe("/api");
    expect(client.defaults.timeout).toBe(10_000);
    expect(client.defaults.transitional?.clarifyTimeoutError).toBe(true);
  });
  it("GET parses every DTO and maps dates", async () => {
    mock.onGet("/tasks").reply(200, { data: [dto] });
    expect(await repository.list()).toEqual([
      { ...dto, createdAt: new Date(dto.createdAt) },
    ]);
  });
  it("POST sends the input and maps a 201 response", async () => {
    mock.onPost("/tasks", { title: "Plan" }).reply(201, { data: dto });
    expect((await repository.create({ title: "Plan" })).id).toBe(dto.id);
    expect(mock.history.post).toHaveLength(1);
  });
  it("rejects invalid list and create responses", async () => {
    mock.onGet("/tasks").reply(200, { data: [{ ...dto, createdAt: "bad" }] });
    mock.onPost("/tasks").reply(201, { data: null });
    await expect(repository.list()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    await expect(repository.create({ title: "Plan" })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });
  it("preserves structured validation failures", async () => {
    mock.onPost("/tasks").reply(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Check title",
        fields: { title: ["Too long"] },
      },
    });
    await expect(repository.create({ title: "Plan" })).rejects.toMatchObject({
      name: "ApiError",
      code: "VALIDATION_ERROR",
      status: 400,
      fields: { title: ["Too long"] },
    });
  });
  it("normalizes network failures", async () => {
    mock.onGet("/tasks").networkError();
    await expect(repository.list()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });
  it("normalizes timeouts", async () => {
    mock.onGet("/tasks").timeout();
    await expect(repository.list()).rejects.toMatchObject({ code: "TIMEOUT" });
  });
  it("hides unstructured HTTP error content", async () => {
    mock.onGet("/tasks").reply(500, "secret server stack");
    await expect(repository.list()).rejects.toMatchObject({
      code: "HTTP_ERROR",
      status: 500,
      message: "Something went wrong. Please try again.",
    });
  });
  it("preserves normalized errors and safely wraps unknown errors", () => {
    const error = new ApiError("Oops", "TEST");
    expect(normalizeApiError(error)).toBe(error);
    expect(normalizeApiError(new Error("secret"))).toMatchObject({
      code: "UNKNOWN_ERROR",
    });
  });
});
