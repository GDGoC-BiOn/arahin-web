"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import {
  ChevronLeftIcon,
  DownloadIcon,
  InfoIcon,
} from "@/shared/presentation/icons";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import { parseLessonContent } from "../domain/lesson-content";
import { LessonBody } from "./lesson-body";
import { FADE, PRESS } from "./motion-tokens";

export function ReaderScreen({
  title,
  heading,
  downloadHref,
  contentMarkdown,
  hasQuiz,
  onBack,
  onContinue,
}: {
  title: string;
  heading: string;
  downloadHref: string;
  contentMarkdown: string;
  hasQuiz: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const sections = useMemo(
    () => parseLessonContent(contentMarkdown),
    [contentMarkdown],
  );

  return (
    <AppPanel surface="bg-[#f8fafc]">
      <main
        id="main"
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pb-32"
      >
        {/* The soft wash behind the title, as in the design. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[200px] left-1/2 h-[231px] w-[256px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl"
        />

        <header className="relative flex items-center gap-3 p-[19px]">
          <motion.button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            whileTap={{ scale: 0.92 }}
            transition={PRESS}
            className="flex shrink-0 items-center justify-center rounded-[20px] bg-primary-500 p-2 text-white"
          >
            <ChevronLeftIcon className="size-5" />
          </motion.button>
          <h1 className="flex-1 text-center text-base leading-[1.25] font-bold text-[#0f172a]">
            {heading}
          </h1>
          {/*
            The design's info button has no destination in the product yet, so
            it renders in place but inert rather than pretending to lead
            somewhere — the same treatment the Settings rows get.
          */}
          <button
            type="button"
            disabled
            aria-label="Info materi — segera hadir"
            className="flex shrink-0 cursor-not-allowed items-center justify-center rounded-[20px] bg-primary-100 p-2 text-primary-500 opacity-50"
          >
            <InfoIcon className="size-5" />
          </button>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={FADE}
          className="relative mx-auto flex w-[351px] max-w-full flex-col items-center gap-[30px] px-5 pt-10 sm:px-0"
        >
          <div className="flex w-full flex-col items-center gap-5">
            <h2 className="max-w-[262px] text-center text-xl leading-[1.25] font-bold text-[#0f172a]">
              {title}
            </h2>
            <motion.a
              href={downloadHref}
              download
              whileTap={{ scale: 0.98 }}
              transition={PRESS}
              className="flex items-center justify-center gap-2 rounded-[20px] border border-primary-500 bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
            >
              <DownloadIcon className="size-5" />
              Download PDF
            </motion.a>
          </div>

          {sections.length ? (
            <LessonBody sections={sections} />
          ) : (
            <p className="rounded-[20px] border border-dashed border-[#cbd5e1] px-4 py-8 text-center text-xs text-[#64748b]">
              Materi untuk sesi ini masih kosong.
            </p>
          )}
        </motion.div>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-[5] flex flex-col gap-3 rounded-t-[30px] border border-[#cbd5e1] bg-[#f1f5f9] px-[18px] py-5">
        <motion.button
          type="button"
          onClick={onContinue}
          whileTap={{ scale: 0.98 }}
          transition={PRESS}
          className="w-full rounded-[20px] bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-white"
        >
          Selanjutnya
        </motion.button>
        <p className="text-center text-xs leading-[1.25] text-[#64748b]">
          Yuk Baca dengan serius
        </p>
      </div>
    </AppPanel>
  );
}
