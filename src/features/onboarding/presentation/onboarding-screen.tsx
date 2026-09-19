"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import type { OnboardingUseCases } from "../application/onboarding-use-cases";
import type { SlideDirection } from "../domain/onboarding-progress";
import {
  DRAG_ELASTIC,
  FADE_IN,
  SCREEN_EXIT,
  SLIDE_OFFSET,
  SLIDE_SPRING,
  STAGGER,
} from "./motion-tokens";
import { PrimaryButton } from "./primary-button";
import { ProgressTrack } from "./progress-track";
import { SlideIllustration } from "./slide-illustration";
import { useSlideDeck } from "./use-slide-deck";

/**
 * Enter and exit travel along the same axis as the navigation, and because
 * AnimatePresence lets them overlap the viewport is never empty between slides.
 */
const slideVariants = {
  enter: (direction: SlideDirection) => ({
    x: direction * SLIDE_OFFSET,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: SlideDirection) => ({
    x: direction * -SLIDE_OFFSET,
    opacity: 0,
  }),
};

export function OnboardingScreen({
  useCases,
  onFinish,
  onLogin,
}: {
  useCases: OnboardingUseCases;
  onFinish: () => void;
  onLogin: () => void;
}) {
  const slides = useCases.getSlides();
  const viewport = useRef<HTMLDivElement>(null);
  const deck = useSlideDeck({
    slides,
    onComplete: () => {
      useCases.markCompleted();
      onFinish();
    },
  });
  const { slide, direction, index, count, isLast, isFinishing } = deck;

  return (
    <AppPanel>
      <motion.main
        animate={{ opacity: isFinishing ? 0 : 1 }}
        transition={SCREEN_EXIT}
        id="main"
        className="flex flex-1 flex-col px-6 pt-6 pb-8"
      >
        <ProgressTrack
          slideIds={slides.map((entry) => entry.id)}
          activeIndex={index}
        />

        <div
          ref={viewport}
          className="relative flex-1 touch-pan-y overflow-hidden"
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SLIDE_SPRING}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              // 1:1 finger tracking where a neighbour exists, rubber-banding at
              // the two ends instead of a dead stop.
              dragElastic={{
                left: isLast ? DRAG_ELASTIC : 1,
                right: index > 0 ? 1 : DRAG_ELASTIC,
                top: 0,
                bottom: 0,
              }}
              dragMomentum={false}
              onDragEnd={(_event, info) => {
                deck.commitSwipe({
                  offsetX: info.offset.x,
                  velocityX: info.velocity.x,
                  viewportWidth: viewport.current?.offsetWidth ?? 1,
                });
              }}
              className="absolute inset-0 flex cursor-grab flex-col justify-end gap-8 active:cursor-grabbing"
            >
              <div className="flex flex-1 items-center justify-center">
                <SlideIllustration
                  illustration={slide.illustration}
                  priority={index === 0}
                />
              </div>
              <div className="flex flex-col gap-4">
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...FADE_IN, delay: STAGGER }}
                  className="text-[32px] leading-[1.25] font-bold tracking-[-0.8px] text-ink"
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...FADE_IN, delay: STAGGER * 2 }}
                  className="text-base leading-[1.25] text-muted"
                >
                  {slide.subtitle}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-3 pt-8">
          <PrimaryButton
            label={slide.ctaLabel}
            pending={isFinishing}
            pendingLabel="Menyiapkan beranda…"
            onActivate={deck.activatePrimary}
          />
          <p className="text-center text-sm leading-[1.25] text-subtle">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={onLogin}
              className="font-semibold text-primary-500"
            >
              Masuk
            </button>
          </p>
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {isFinishing
            ? "Menyiapkan beranda…"
            : `Langkah ${index + 1} dari ${count}: ${slide.title}`}
        </p>
      </motion.main>
    </AppPanel>
  );
}
