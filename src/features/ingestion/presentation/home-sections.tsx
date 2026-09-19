"use client";

import { motion } from "motion/react";
import {
  SearchIcon,
  SparklesIcon,
  StepAiIcon,
  StepLearnIcon,
  StepUploadIcon,
} from "@/shared/presentation/icons";
import { PRESS } from "./motion-tokens";

export function HomeHeadline() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl leading-[1.25] font-bold tracking-[-0.5px] text-secondary-500">
        Belajar Lebih Cerdas,
        <br />
        Bukan Lebih Lama
      </h1>
      <p className="text-[13px] leading-[1.6] text-muted">
        Ubah dokumen menjadi materi belajar dengan bantuan AI.
      </p>
    </div>
  );
}

/** Filters the user's spaces through `GET /v1/spaces?q=`. */
export function HomeSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <search className="flex w-full items-center gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3 text-[#94a3b8] focus-within:ring-2 focus-within:ring-primary-300">
      <SearchIcon className="size-[18px] shrink-0" />
      <input
        id="home-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cari dokumen atau topik…"
        aria-label="Cari dokumen atau topik"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-sm leading-[1.25] text-[#101010] outline-none placeholder:text-[#cbd5e1]"
      />
    </search>
  );
}

const STEPS = [
  {
    id: "upload",
    Icon: StepUploadIcon,
    title: "Unggah Materi",
    body: "Unggah buku, catatan, atau artikel penelitian dengan aman dan mudah.",
  },
  {
    id: "analyse",
    Icon: StepAiIcon,
    title: "Analisis oleh AI",
    body: "Arahin menganalisis materi untuk menemukan inti pembelajaran.",
  },
  {
    id: "learn",
    Icon: StepLearnIcon,
    title: "Belajar Lebih Efektif",
    body: "Dapatkan rangkuman, kuis, dan ppt yang dipersonalisasi untuk belajar Anda.",
  },
] as const;

export function ThreeStepGuide() {
  return (
    <section aria-labelledby="steps-title" className="flex flex-col gap-3">
      <h2 id="steps-title" className="text-[15px] font-bold text-secondary-500">
        Mulai Belajar dalam 3 Langkah
      </h2>
      <ol className="flex flex-col gap-4">
        {STEPS.map(({ id, Icon, title, body }) => (
          <li key={id} className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eaf0fc] text-primary-600">
              <Icon className="size-[18px]" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">{title}</span>
              <span className="text-xs leading-[1.25] text-subtle">{body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AiRecommendationCard({ onStart }: { onStart: () => void }) {
  return (
    <section
      // Measured off the export: a diagonal wash, darker at the top-left.
      className="flex flex-col gap-3 rounded-[20px] bg-[linear-gradient(135deg,#2a63e2_0%,#4582f1_100%)] p-4"
    >
      <h2 className="flex items-center gap-2 text-xs font-semibold text-white">
        <SparklesIcon className="size-4" />
        AI Rekomendasi
      </h2>
      <p className="text-[13px] leading-[1.5] text-white/85">
        Unggah materi belajar berikutnya dan biarkan AI membuat flashcard, kuis,
        dan rangkuman secara instan.
      </p>
      <motion.button
        type="button"
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        transition={PRESS}
        className="mt-1 flex h-10 w-fit items-center gap-2 rounded-full bg-white px-4 text-[13px] font-bold text-primary-500"
      >
        Mulai Sekarang
        <span aria-hidden="true">→</span>
      </motion.button>
    </section>
  );
}
