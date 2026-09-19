import { describe, expect, it } from "vitest";
import { describeFailure } from "@/features/ingestion/domain/ingestion-failure";

describe("describeFailure", () => {
  it("keeps the design's sheet for unreadable content", () => {
    for (const code of [
      "EMPTY_DOCUMENT",
      "PARSE_FAILED",
      "UNSUPPORTED_TYPE",
      "empty",
    ]) {
      const copy = describeFailure(code);
      expect(copy.kind).toBe("content");
      expect(copy.showReasons).toBe(true);
    }
  });

  it("does not call a size limit an AI detection failure", () => {
    for (const code of ["DOCUMENT_TOO_LARGE", "FILE_TOO_LARGE", "too-large"]) {
      const copy = describeFailure(code);
      expect(copy.title).toBe("File Terlalu Besar");
      expect(copy.showReasons).toBe(false);
    }
    expect(describeFailure("NO_FILE", 413).kind).toBe("size");
  });

  it("routes an expired session to re-login copy", () => {
    expect(describeFailure("UNAUTHORIZED").kind).toBe("session");
    expect(describeFailure("HTTP_ERROR", 401).kind).toBe("session");
  });

  it("falls back to a service failure, never English", () => {
    const copy = describeFailure("AI_UNAVAILABLE");
    expect(copy.kind).toBe("service");
    expect(copy.message).not.toMatch(/unavailable/i);
    expect(describeFailure("WHATEVER").kind).toBe("service");
    expect(describeFailure("NETWORK_ERROR").message).toContain("Koneksi");
  });
});
