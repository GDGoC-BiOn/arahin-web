/**
 * What the backend will actually accept. The parser's allowlist is the real
 * gate (arahin-parser/src/routes/parse.ts), and the Go side caps the body at
 * 25 MiB before it ever reaches the parser.
 *
 * Note the design's dropzone advertises PDF/DOCX/PPTX. DOCX and PPTX are
 * deliberately unsupported upstream — they would need LibreOffice — so the UI
 * offers what can genuinely be processed instead of failing after the upload.
 */
export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

/** Labels for the dropzone chips, in the design's order. */
export const ACCEPTED_LABELS = ["PDF", "PNG", "JPG"] as const;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export type UploadRejection =
  | { reason: "unsupported-type"; message: string }
  | { reason: "too-large"; message: string }
  | { reason: "empty"; message: string };

export type UploadCandidate = {
  name: string;
  size: number;
  type: string;
};

function isAccepted(type: string): type is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Rejects locally what the backend would reject anyway, before any upload. */
export function rejectUpload(
  candidate: UploadCandidate,
): UploadRejection | null {
  if (candidate.size === 0) {
    return { reason: "empty", message: "File ini kosong." };
  }
  if (!isAccepted(candidate.type)) {
    return {
      reason: "unsupported-type",
      message: `Format ${describeType(candidate)} belum didukung. Gunakan ${ACCEPTED_LABELS.join(", ")}.`,
    };
  }
  if (candidate.size > MAX_UPLOAD_BYTES) {
    return {
      reason: "too-large",
      message: `Ukuran maksimal ${formatBytes(MAX_UPLOAD_BYTES)}. File kamu ${formatBytes(candidate.size)}.`,
    };
  }
  return null;
}

function describeType(candidate: UploadCandidate): string {
  const extension = candidate.name.includes(".")
    ? candidate.name.split(".").pop()
    : null;
  return extension ? extension.toUpperCase() : candidate.type || "ini";
}

/**
 * `POST /v1/spaces` needs a title and a sourceType, but the design's flow only
 * ever gives us a dropped file. Both are derived from it: the filename without
 * its extension reads far better in a list than "Untitled", and sourceType
 * follows the same image/pdf split the backend itself applies.
 */
export function deriveSpaceTitle(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const cleaned = withoutExtension.replace(/[_-]+/g, " ").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 120) : "Dokumen tanpa nama";
}

export function deriveSourceType(mimeType: string): "pdf" | "image" {
  return mimeType.startsWith("image/") ? "image" : "pdf";
}
