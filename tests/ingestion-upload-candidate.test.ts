import { describe, expect, it } from "vitest";
import {
  ACCEPTED_MIME_TYPES,
  deriveSourceType,
  deriveSpaceTitle,
  formatBytes,
  MAX_UPLOAD_BYTES,
  rejectUpload,
} from "@/features/ingestion/domain/upload-candidate";

const file = (
  over: Partial<{ name: string; size: number; type: string }> = {},
) => ({
  name: "bab1.pdf",
  size: 1024,
  type: "application/pdf",
  ...over,
});

describe("rejectUpload", () => {
  it("accepts exactly what the parser supports", () => {
    for (const type of ACCEPTED_MIME_TYPES) {
      expect(rejectUpload(file({ type }))).toBeNull();
    }
  });

  it("rejects DOCX and PPTX, which the parser deliberately excludes", () => {
    const docx = rejectUpload(
      file({
        name: "materi.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    );
    expect(docx?.reason).toBe("unsupported-type");
    // The message names the extension the user actually dropped.
    expect(docx?.message).toContain("DOCX");
    expect(docx?.message).toContain("PDF, PNG, JPG");

    expect(
      rejectUpload(
        file({ name: "deck.pptx", type: "application/vnd.ms-powerpoint" }),
      )?.reason,
    ).toBe("unsupported-type");
  });

  it("rejects an empty file before anything else", () => {
    expect(rejectUpload(file({ size: 0 }))?.reason).toBe("empty");
  });

  it("enforces the backend's 25 MiB ceiling", () => {
    expect(rejectUpload(file({ size: MAX_UPLOAD_BYTES }))).toBeNull();
    const tooBig = rejectUpload(file({ size: MAX_UPLOAD_BYTES + 1 }));
    expect(tooBig?.reason).toBe("too-large");
    expect(tooBig?.message).toContain("25.0 MB");
  });
});

describe("deriveSpaceTitle", () => {
  it("uses the filename without its extension", () => {
    expect(deriveSpaceTitle("Organic Chemistry Ch.4.pdf")).toBe(
      "Organic Chemistry Ch.4",
    );
  });

  it("turns separators into spaces", () => {
    expect(deriveSpaceTitle("data_integration-notes.pdf")).toBe(
      "data integration notes",
    );
  });

  it("falls back rather than sending an empty title", () => {
    // The backend rejects a blank title with 400 INVALID_BODY.
    expect(deriveSpaceTitle(".pdf")).toBe("Dokumen tanpa nama");
    expect(deriveSpaceTitle("___.pdf")).toBe("Dokumen tanpa nama");
  });

  it("stays inside a sane length", () => {
    expect(deriveSpaceTitle(`${"a".repeat(300)}.pdf`).length).toBe(120);
  });
});

describe("deriveSourceType", () => {
  it("mirrors the backend's own image/pdf split", () => {
    expect(deriveSourceType("image/png")).toBe("image");
    expect(deriveSourceType("image/jpeg")).toBe("image");
    expect(deriveSourceType("application/pdf")).toBe("pdf");
  });
});

describe("formatBytes", () => {
  it("reads naturally at each scale", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
