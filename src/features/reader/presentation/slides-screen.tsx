"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightSmallIcon,
  DownloadIcon,
  FullScreenIcon,
  InfoIcon,
} from "@/shared/presentation/icons";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import { buildDeck, deckMinutes } from "../domain/slide-deck";
import { FADE, PRESS } from "./motion-tokens";

const SLIDE_SPRING = { type: "spring", duration: 0.45, bounce: 0.12 } as const;
const SWIPE_DISTANCE = 60;

export function SlidesScreen({
  title,
  contentMarkdown,
  downloadHref,
  hasQuiz,
  onBack,
  onContinue,
}: {
  title: string;
  contentMarkdown: string;
  downloadHref: string;
  hasQuiz: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const slides = useMemo(
    () => buildDeck(title, contentMarkdown),
    [title, contentMarkdown],
  );
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const stage = useRef<HTMLDivElement>(null);
  const slide = slides[index] ?? slides[0];

  const go = (delta: number) => {
    const next = Math.min(Math.max(index + delta, 0), slides.length - 1);
    if (next !== index) setPage([next, delta]);
  };

  const fullScreen = () => {
    const node = stage.current;
    if (!node) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void node.requestFullscreen?.().catch(() => {});
  };

  return (
    <AppPanel surface="bg-[#f8fafc]">
      <main
        id="main"
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pb-36"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[271px] left-1/2 h-[231px] w-[256px] -translate-x-1/2 rounded-full bg-primary-500/15 blur-3xl"
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
            Materi PPT
          </h1>
          <button
            type="button"
            disabled
            aria-label="Info materi — segera hadir"
            className="flex shrink-0 cursor-not-allowed items-center justify-center rounded-[20px] bg-primary-100 p-2 text-primary-500 opacity-50"
          >
            <InfoIcon className="size-5" />
          </button>
        </header>

        <div className="relative flex flex-col items-center gap-5 px-5 pt-6">
          <div className="flex w-[262px] flex-col items-center gap-2.5 text-center leading-[1.25]">
            <p className="text-xs text-[#64748b]">
              {deckMinutes(slides)} Menit / {slides.length} Halaman
            </p>
            <h2 className="text-xl font-bold break-words text-[#071843]">
              {title}
            </h2>
          </div>
          <div className="flex gap-3">
            <motion.button
              type="button"
              onClick={fullScreen}
              whileTap={{ scale: 0.98 }}
              transition={PRESS}
              className="flex items-center gap-2 rounded-[20px] border border-[#156dff] bg-[#156dff] px-3.5 py-2 text-sm leading-5 font-semibold text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
            >
              <FullScreenIcon className="size-5" />
              Full Screen
            </motion.button>
            <motion.a
              href={downloadHref}
              download
              whileTap={{ scale: 0.98 }}
              transition={PRESS}
              className="flex items-center gap-2 rounded-[20px] border border-[#156dff] bg-[#156dff] px-3.5 py-2 text-sm leading-5 font-semibold text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
            >
              <DownloadIcon className="size-5" />
              Download PPT
            </motion.a>
          </div>
        </div>

        <section
          aria-roledescription="carousel"
          aria-label="Slide materi"
          className="relative flex flex-col items-center gap-5 px-5 pt-14"
        >
          <div
            ref={stage}
            className="relative w-full max-w-[350px] overflow-hidden rounded-[20px] border border-[#cbd5e1] bg-[#f1f5f9] p-4 fullscreen:flex fullscreen:max-w-none fullscreen:items-center fullscreen:justify-center fullscreen:rounded-none fullscreen:bg-[#0f172a] fullscreen:p-8"
          >
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              {slide ? (
                <motion.article
                  key={slide.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={SLIDE_SPRING}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -SWIPE_DISTANCE) go(1);
                    else if (info.offset.x > SWIPE_DISTANCE) go(-1);
                  }}
                  aria-roledescription="slide"
                  aria-label={`${index + 1} dari ${slides.length}`}
                  className="flex aspect-video w-full cursor-grab touch-pan-y flex-col gap-2 overflow-hidden rounded-2xl border border-[#cbd5e1] bg-white p-4 select-none active:cursor-grabbing fullscreen:max-w-[960px]"
                >
                  <h3 className="line-clamp-2 text-sm leading-[1.25] font-bold break-words text-[#071843]">
                    {slide.title}
                  </h3>
                  <ul className="flex min-h-0 flex-1 list-disc flex-col gap-1 overflow-y-auto overscroll-y-contain pl-4 text-[10px] leading-[1.45] text-[#475569]">
                    {slide.bullets.map((bullet) => (
                      <li key={`${slide.id}-${bullet}`} className="break-words">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Slide sebelumnya"
              whileTap={{ scale: 0.92 }}
              transition={PRESS}
              className="flex items-center justify-center rounded-[20px] bg-primary-500 p-2 text-white disabled:opacity-40"
            >
              <ChevronLeftIcon className="size-5" />
            </motion.button>
            <motion.span
              key={index}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={FADE}
              aria-live="polite"
              className="min-w-10 text-center text-sm leading-5 font-semibold text-[#64748b] tabular-nums"
            >
              {index + 1}/{slides.length}
            </motion.span>
            <motion.button
              type="button"
              onClick={() => go(1)}
              disabled={index === slides.length - 1}
              aria-label="Slide berikutnya"
              whileTap={{ scale: 0.92 }}
              transition={PRESS}
              className="flex items-center justify-center rounded-[20px] bg-primary-500 p-2 text-white disabled:opacity-40"
            >
              <ChevronRightSmallIcon className="size-5" />
            </motion.button>
          </div>
        </section>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-[5] flex flex-col gap-3 rounded-t-[30px] border border-[#cbd5e1] bg-[#f1f5f9] px-[18px] py-5">
        <motion.button
          type="button"
          onClick={onContinue}
          whileTap={{ scale: 0.98 }}
          transition={PRESS}
          className="w-full rounded-[20px] bg-primary-500 px-3.5 py-2 text-sm leading-5 font-semibold text-white"
        >
          {hasQuiz ? "Selanjutnya" : "Kembali ke Sesi"}
        </motion.button>
        <p className="text-center text-xs leading-[1.25] text-[#64748b]">
          {hasQuiz ? "Yuk Baca dengan serius" : "Sesi ini belum punya kuis"}
        </p>
      </div>
    </AppPanel>
  );
}
