import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { describe, expect, it } from "vitest";
import { createBrowserIngestionGateway } from "@/features/ingestion/infrastructure/browser-ingestion-gateway";
import { createBrowserJourneyGateway } from "@/features/journey/infrastructure/browser-journey-gateway";

const failedGeneration = {
  generationId: "generation-1",
  spaceId: "space-1",
  status: "failed" as const,
  stage: "generating_lessons",
  progress: { completed: 1, total: 2 },
  errorCode: "LESSON_GENERATION_FAILED",
  errorMessage: "One lesson failed.",
  lessons: [
    {
      conceptId: "concept-1",
      orderIndex: 1,
      status: "completed" as const,
      title: "Ready lesson",
      contentMarkdown: "# Ready",
    },
    {
      conceptId: "concept-2",
      orderIndex: 2,
      status: "failed" as const,
    },
  ],
};

describe("generation gateway contracts", () => {
  it("accepts the backend's plain failed lesson-task status in ingestion", async () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const gateway = createBrowserIngestionGateway(client);

    mock
      .onGet("/spaces/space-1/blueprint/generations/generation-1")
      .reply(200, failedGeneration);

    const job = await gateway.getBlueprintGeneration("space-1", "generation-1");

    expect(job.lessons?.[1]?.status).toBe("failed");
    expect(job.status).toBe("failed");
  });

  it("accepts the same failed lesson-task status in the journey poller", async () => {
    const client = axios.create();
    const mock = new MockAdapter(client);
    const gateway = createBrowserJourneyGateway(client);

    mock
      .onGet("/spaces/space-1/blueprint/generations/generation-1")
      .reply(200, failedGeneration);

    const job = await gateway.loadGeneration("space-1", "generation-1");

    expect(job.lessons?.[1]?.status).toBe("failed");
    expect(job.errorCode).toBe("LESSON_GENERATION_FAILED");
  });
});
