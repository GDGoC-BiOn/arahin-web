import { z } from "zod";
import type { TaskUseCases } from "../application/task-use-cases";
import { TaskValidationError } from "../domain/task";
import { toTaskDto } from "./task-mapper";
import { createTaskRequestSchema } from "./task-schemas";

const headers = { "Cache-Control": "no-store" };
function failure(error: unknown): Response {
  if (error instanceof TaskValidationError)
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          fields: error.fields,
        },
      },
      { status: 400, headers },
    );
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
      },
    },
    { status: 500, headers },
  );
}

export function createTaskHandlers(useCases: TaskUseCases) {
  return {
    async GET() {
      try {
        return Response.json(
          { data: (await useCases.list()).map(toTaskDto) },
          { headers },
        );
      } catch (error) {
        return failure(error);
      }
    },
    async POST(request: Request) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Send a valid JSON object.",
              fields: {},
            },
          },
          { status: 400, headers },
        );
      }
      const parsed = createTaskRequestSchema.safeParse(body);
      if (!parsed.success)
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Please check your task details.",
              fields: z.flattenError(parsed.error).fieldErrors,
            },
          },
          { status: 400, headers },
        );
      try {
        return Response.json(
          { data: toTaskDto(await useCases.create(parsed.data)) },
          { status: 201, headers },
        );
      } catch (error) {
        return failure(error);
      }
    },
  };
}
