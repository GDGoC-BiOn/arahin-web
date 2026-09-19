/**
 * The backend's error codes carry copy that is either English or aimed at a
 * different surface, so they are mapped to something a user on this screen
 * can act on. UNAUTHORIZED_GUEST is the exception: its message is deliberate
 * Indonesian product copy, so it passes through.
 */
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email atau kata sandi salah.",
  EMAIL_TAKEN: "Email ini sudah terdaftar. Coba masuk saja.",
  INVALID_BODY: "Ada data yang belum benar. Periksa kembali isian kamu.",
  DATABASE_UNAVAILABLE:
    "Server sedang tidak bisa memproses akun. Coba beberapa saat lagi.",
  SESSION_CONFLICT: "Sesi lain sedang aktif. Coba lagi sebentar.",
  TIMEOUT: "Server terlalu lama merespons. Coba lagi.",
  TOKEN_EXPIRED:
    "Tautan reset sudah kedaluwarsa. Minta tautan baru dari halaman Lupa Kata Sandi.",
  TOKEN_USED: "Tautan reset ini sudah dipakai. Minta tautan baru bila perlu.",
  INVALID_TOKEN:
    "Tautan reset tidak valid. Pastikan kamu membuka tautan terbaru dari email.",
  NETWORK_ERROR: "Tidak bisa menghubungi server. Periksa koneksi kamu.",
};

export function authErrorMessage(code: string, fallback: string): string {
  return MESSAGES[code] ?? fallback;
}
