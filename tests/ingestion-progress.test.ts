import { describe, expect, it } from "vitest";
import {
  captionForGenerationStage,
  INGESTION_STEP_COUNT,
  INITIAL_INGESTION_STATE,
  type IngestionState,
  ingestionPercent,
  ingestionSteps,
  PHASE_CAPTIONS,
} from "@/features/ingestion/domain/ingestion-progress";

const state = (over: Partial<IngestionState> = {}): IngestionState => ({
  ...INITIAL_INGESTION_STATE,
  ...over,
});

const statuses = (s: IngestionState) => ingestionSteps(s).map((x) => x.status);

describe("ingestionPercent", () => {
  it("starts at zero and only reaches 100 when genuinely done", () => {
    expect(ingestionPercent(state())).toBe(0);
    expect(ingestionPercent(state({ phase: "done" }))).toBe(100);
  });

  it("tracks real bytes during upload", () => {
    // The only phase with a truthful fraction behind it.
    expect(
      ingestionPercent(state({ phase: "uploading", uploadedFraction: 0 })),
    ).toBe(0);
    expect(
      ingestionPercent(state({ phase: "uploading", uploadedFraction: 0.5 })),
    ).toBe(10);
    expect(
      ingestionPercent(state({ phase: "uploading", uploadedFraction: 1 })),
    ).toBe(20);
  });

  it("still moves while the browser reports no byte progress", () => {
    // A small file is handed to the socket in one go: the only progress event
    // arrives at the end. The bar must not sit frozen until then.
    const still = ingestionPercent(
      state({ phase: "uploading", uploadedFraction: 0, elapsedInPhaseMs: 0 }),
    );
    const later = ingestionPercent(
      state({
        phase: "uploading",
        uploadedFraction: 0,
        elapsedInPhaseMs: 4_000,
      }),
    );
    expect(later).toBeGreaterThan(still);
    expect(later).toBeLessThan(20);
  });

  it("lets real byte progress override the eased floor", () => {
    // Bytes say 75% almost immediately; the floor must not hold it back.
    const byBytes = ingestionPercent(
      state({
        phase: "uploading",
        uploadedFraction: 0.75,
        elapsedInPhaseMs: 10,
      }),
    );
    expect(byBytes).toBe(15);
  });

  it("never passes the upload ceiling before the bytes are gone", () => {
    const forever = ingestionPercent(
      state({
        phase: "uploading",
        uploadedFraction: 0,
        elapsedInPhaseMs: 600_000,
      }),
    );
    expect(forever).toBeLessThan(20);
  });

  it("clamps a nonsense upload fraction", () => {
    expect(
      ingestionPercent(state({ phase: "uploading", uploadedFraction: -1 })),
    ).toBe(0);
    expect(
      ingestionPercent(state({ phase: "uploading", uploadedFraction: 9 })),
    ).toBe(20);
  });

  it("never reaches its phase ceiling, however long the wait", () => {
    // An hour inside blueprint generation still must not claim completion.
    const forever = ingestionPercent(
      state({ phase: "generating", elapsedInPhaseMs: 3_600_000 }),
    );
    expect(forever).toBeLessThan(95);
    expect(forever).toBeGreaterThan(90);
  });

  it("never goes backwards across a phase handover", () => {
    const uploadDone = ingestionPercent(
      state({ phase: "uploading", uploadedFraction: 1 }),
    );
    const parseStart = ingestionPercent(
      state({ phase: "parsing", elapsedInPhaseMs: 0 }),
    );
    const parseLong = ingestionPercent(
      state({ phase: "parsing", elapsedInPhaseMs: 60_000 }),
    );
    const generateStart = ingestionPercent(
      state({ phase: "generating", elapsedInPhaseMs: 0 }),
    );
    expect(parseStart).toBeGreaterThanOrEqual(uploadDone);
    expect(generateStart).toBeGreaterThanOrEqual(parseLong);
  });

  it("rises monotonically within an open-ended phase", () => {
    let previous = -1;
    for (const ms of [0, 1_000, 5_000, 15_000, 45_000, 120_000]) {
      const value = ingestionPercent(
        state({ phase: "generating", elapsedInPhaseMs: ms }),
      );
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it("reports nothing for a failure", () => {
    expect(ingestionPercent(state({ phase: "failed" }))).toBe(0);
  });
});

describe("ingestionSteps", () => {
  it("renders the five steps from the design", () => {
    expect(INGESTION_STEP_COUNT).toBe(5);
    expect(ingestionSteps(state()).map((s) => s.label)).toEqual([
      "Membaca File",
      "Mengekstrak Informasi",
      "Menemukan Konsep Utama",
      "Menyusun Peta Pengetahuan",
      "Membuat Materi Belajar",
    ]);
  });

  it("shows everything pending before the flow starts", () => {
    expect(statuses(state())).toEqual(Array(5).fill("pending"));
  });

  it("marks only the reading step active while uploading", () => {
    expect(
      statuses(state({ phase: "uploading", uploadedFraction: 0.4 })),
    ).toEqual(["active", "pending", "pending", "pending", "pending"]);
  });

  it("settles reading and activates extraction once parsing begins", () => {
    expect(
      statuses(state({ phase: "parsing", elapsedInPhaseMs: 500 })),
    ).toEqual(["done", "active", "pending", "pending", "pending"]);
  });

  it("advances through the three blueprint steps as generation runs", () => {
    const early = statuses(state({ phase: "generating", elapsedInPhaseMs: 0 }));
    expect(early).toEqual(["done", "done", "active", "pending", "pending"]);

    const later = statuses(
      state({ phase: "generating", elapsedInPhaseMs: 40_000 }),
    );
    expect(later.slice(0, 2)).toEqual(["done", "done"]);
    expect(later).toContain("active");
  });

  it("never marks the final step done on elapsed time alone", () => {
    // Only the real /blueprint response may complete the last step.
    for (const ms of [60_000, 300_000, 3_600_000]) {
      const s = statuses(state({ phase: "generating", elapsedInPhaseMs: ms }));
      expect(s[4]).not.toBe("done");
    }
  });

  it("marks every step done only when the flow is done", () => {
    expect(statuses(state({ phase: "done" }))).toEqual(Array(5).fill("done"));
  });

  it("names generation stages instead of a generic wait", () => {
    expect(
      captionForGenerationStage("extracting_blueprint", "generating"),
    ).toBe("Membangun blueprint pembelajaran…");
    expect(captionForGenerationStage("generating_lessons", "generating")).toBe(
      "Membuat materi belajar…",
    );
    expect(captionForGenerationStage("finalizing", "generating")).toBe(
      "Menyimpan hasil…",
    );
    expect(captionForGenerationStage("extracting_blueprint", "uploading")).toBe(
      PHASE_CAPTIONS.uploading,
    );
  });

  it("shows exactly one active step at any point in an active phase", () => {
    for (const s of [
      state({ phase: "uploading", uploadedFraction: 0.2 }),
      state({ phase: "parsing", elapsedInPhaseMs: 3_000 }),
      state({ phase: "generating", elapsedInPhaseMs: 0 }),
      state({ phase: "generating", elapsedInPhaseMs: 20_000 }),
      state({ phase: "generating", elapsedInPhaseMs: 90_000 }),
    ]) {
      expect(statuses(s).filter((x) => x === "active")).toHaveLength(1);
    }
  });
});
