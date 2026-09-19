export type SlideIllustration = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type OnboardingSlide = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  illustration: SlideIllustration;
};

/**
 * Fixed-length tuple rather than OnboardingSlide[]: under
 * noUncheckedIndexedAccess a plain array would type every lookup as
 * `OnboardingSlide | undefined`, forcing guards on a deck we know is complete.
 */
export type OnboardingDeck = readonly [
  OnboardingSlide,
  OnboardingSlide,
  OnboardingSlide,
];

export const ONBOARDING_SLIDES: OnboardingDeck = [
  {
    id: "upload",
    title: "Upload Soal dengan Mudah",
    subtitle:
      "Unggah file dalam berbagai format, Kami siap memprosesnya untuk kamu.",
    ctaLabel: "Lanjut",
    illustration: {
      src: "/onboarding/slide-1.webp",
      width: 318,
      height: 286,
      alt: "Folder biru berisi dokumen dengan ikon unggah, dikelilingi label PDF dan DOC",
    },
  },
  {
    id: "rangkum",
    title: "AI Merangkum Secara Cerdas",
    subtitle: "Arahin mampu merangkum materi penting secara otomatis.",
    ctaLabel: "Lanjut",
    illustration: {
      src: "/onboarding/slide-2.webp",
      width: 319,
      height: 319,
      alt: "Robot kecil di samping dokumen dan kartu rangkuman bertanda kilau",
    },
  },
  {
    id: "hasil",
    title: "Dapatkan Hasil Sesuai Kebutuhan",
    subtitle:
      "Ubah hasil rangkuman menjadi PPT, Quiz, atau rangkuman dalam hitungan detik.",
    ctaLabel: "Mulai Sekarang",
    illustration: {
      src: "/onboarding/slide-3.webp",
      width: 286,
      height: 286,
      alt: "Jalur berkelok menuju penanda lokasi di atas tumpukan buku bertopi wisuda",
    },
  },
];

export const SLIDE_COUNT = ONBOARDING_SLIDES.length;
