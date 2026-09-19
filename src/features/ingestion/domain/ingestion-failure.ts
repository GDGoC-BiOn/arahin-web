/**
 * What the failure sheet says for a given error code. The backend and parser
 * send English developer messages; those never reach the learner. Only the
 * code is used, and anything unrecognised falls back to a generic retry.
 */
export type FailureKind = "content" | "size" | "service" | "session";

export type FailureCopy = {
  kind: FailureKind;
  title: string;
  message: string;
  /** Whether the "file mungkin rusak…" checklist applies to this failure. */
  showReasons: boolean;
};

const CONTENT = new Set([
  "EMPTY_DOCUMENT",
  "PARSE_FAILED",
  "UNSUPPORTED_TYPE",
  "unsupported-type",
  "empty",
]);
const SIZE = new Set(["DOCUMENT_TOO_LARGE", "FILE_TOO_LARGE", "too-large"]);
const SESSION = new Set([
  "UNAUTHORIZED",
  "UNAUTHENTICATED",
  "SESSION_REVOKED",
  "INVALID_TOKEN",
]);

export function describeFailure(code: string, status?: number): FailureCopy {
  if (CONTENT.has(code)) {
    return {
      kind: "content",
      title: "AI Detection Failed",
      message:
        "Kami tidak dapat mendeteksi konten yang valid dari file ini. Pastikan file tidak rusak, terkunci, atau hanya berisi gambar tanpa teks.",
      showReasons: true,
    };
  }
  if (SIZE.has(code) || status === 413) {
    return {
      kind: "size",
      title: "File Terlalu Besar",
      message:
        "Ukuran file melebihi batas 25 MB atau isinya terlalu panjang untuk diproses. Coba pisahkan menjadi beberapa file yang lebih kecil.",
      showReasons: false,
    };
  }
  if (SESSION.has(code) || status === 401) {
    return {
      kind: "session",
      title: "Sesi Berakhir",
      message: "Sesi kamu sudah berakhir. Masuk lagi untuk melanjutkan.",
      showReasons: false,
    };
  }
  return {
    kind: "service",
    title: "Gagal Memproses",
    message:
      code === "NETWORK_ERROR" || code === "TIMEOUT"
        ? "Koneksi terputus atau terlalu lama. Periksa internet kamu, lalu coba lagi."
        : "Layanan kami sedang bermasalah. File kamu tidak apa-apa — coba lagi sebentar lagi.",
    showReasons: false,
  };
}
