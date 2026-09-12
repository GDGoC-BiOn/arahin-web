import { describe, expect, it, vi } from "vitest";
import { createTaskUseCases } from "@/features/tasks/application/task-use-cases";
import { createMemoryTaskRepository } from "@/features/tasks/infrastructure/memory-task-repository";
import { createTaskHandlers } from "@/features/tasks/infrastructure/task-handlers";
import { toTask, toTaskDto } from "@/features/tasks/infrastructure/task-mapper";
import {
  createTaskRequestSchema,
  taskDtoSchema,
  taskListResponseSchema,
} from "@/features/tasks/infrastructure/task-schemas";
import { taskFormSchema } from "@/features/tasks/presentation/task-form-schema";

const dto = {
  id: "e0f12cc5-0396-4317-b88e-dbeebea21bd4",
  title: "Plan",
  createdAt: "2026-09-12T10:00:00.000Z",
};

describe("boundary schemas and mapping", () => {
  it.each([
    { title: "" },
    { title: " " },
    { title: 42 },
    { title: "a".repeat(61) },
    { title: "A", description: "x".repeat(241) },
    { title: "A", description: null },
    { title: "A", admin: true },
  ])("rejects invalid API input %j", (input) => {
    expect(createTaskRequestSchema.safeParse(input).success).toBe(false);
  });
  it("accepts and trims API and form input", () => {
    expect(createTaskRequestSchema.parse({ title: " A " })).toEqual({
      title: "A",
    });
    expect(taskFormSchema.parse({ title: " A ", description: " B " })).toEqual({
      title: "A",
      description: "B",
    });
    expect(
      taskFormSchema.safeParse({ title: " ", description: "" }).success,
    ).toBe(false);
    expect(
      taskFormSchema.safeParse({ title: "A", description: "x".repeat(241) })
        .success,
    ).toBe(false);
  });
  it.each([
    { ...dto, id: "bad" },
    { ...dto, createdAt: "yesterday" },
    { ...dto, createdAt: "2026-02-30T00:00:00Z" },
    { ...dto, title: "" },
    { ...dto, description: 2 },
  ])("rejects malformed task DTOs", (input) => {
    expect(taskDtoSchema.safeParse(input).success).toBe(false);
  });
  it("requires the response envelope", () => {
    expect(taskListResponseSchema.safeParse([dto]).success).toBe(false);
    expect(taskListResponseSchema.parse({ data: [dto] }).data).toEqual([dto]);
  });
  it("maps transport dates into Dates and back without leaking fields", () => {
    const task = toTask({ ...dto, description: "" });
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task).not.toHaveProperty("description");
    expect(toTaskDto(task)).toEqual(dto);
  });
});

describe("HTTP handlers", () => {
  function setup() {
    return createTaskHandlers(createTaskUseCases(createMemoryTaskRepository()));
  }
  function request(body: string) {
    return new Request("http://localhost/api/tasks", { method: "POST", body });
  }
  it("returns 201, normalizes input, and exposes it in GET", async () => {
    const handlers = setup();
    const response = await handlers.POST(
      request(JSON.stringify({ title: " Plan ", description: " " })),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(taskDtoSchema.safeParse(body.data).success).toBe(true);
    expect(body.data.title).toBe("Plan");
    expect(body.data).not.toHaveProperty("description");
    const list = await handlers.GET();
    expect(list.headers.get("Cache-Control")).toBe("no-store");
    expect(await list.json()).toEqual({ data: [body.data] });
  });
  it.each(["{", "null", '{"title":""}', '{"title":42}'])(
    "returns a 400 validation envelope for %s",
    async (body) => {
      const response = await setup().POST(request(body));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "VALIDATION_ERROR", fields: {} },
      });
    },
  );
  it("never leaks unexpected failure details", async () => {
    const failure = vi
      .fn()
      .mockRejectedValue(new Error("secret connection string"));
    const handlers = createTaskHandlers({ list: failure, create: failure });
    for (const response of [
      await handlers.GET(),
      await handlers.POST(request('{"title":"Plan"}')),
    ]) {
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again.",
        },
      });
    }
  });
});
