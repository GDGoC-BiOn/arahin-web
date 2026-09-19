import { describe, expect, it } from "vitest";
import {
  advance,
  goTo,
  INITIAL_DECK_STATE,
  isLastSlide,
  resolveSwipe,
  retreat,
  segmentState,
} from "@/features/onboarding/domain/onboarding-progress";
import {
  ONBOARDING_SLIDES,
  SLIDE_COUNT,
} from "@/features/onboarding/domain/onboarding-slide";

const swipe = (offsetX: number, velocityX: number) =>
  resolveSwipe({
    offsetX,
    velocityX,
    viewportWidth: 375,
    distanceRatio: 0.25,
    velocityThreshold: 300,
  });

describe("deck navigation", () => {
  it("advances one slide and records forward direction", () => {
    expect(advance(INITIAL_DECK_STATE, SLIDE_COUNT)).toEqual({
      index: 1,
      direction: 1,
    });
  });

  it("clamps at the last slide without resetting direction", () => {
    const last = { index: SLIDE_COUNT - 1, direction: 1 } as const;
    expect(advance(last, SLIDE_COUNT)).toBe(last);
  });

  it("retreats one slide and records backward direction", () => {
    expect(retreat({ index: 2, direction: 1 })).toEqual({
      index: 1,
      direction: -1,
    });
  });

  it("clamps at the first slide", () => {
    expect(retreat(INITIAL_DECK_STATE)).toBe(INITIAL_DECK_STATE);
  });

  it("derives direction from the sign of the jump", () => {
    expect(goTo(INITIAL_DECK_STATE, 2, SLIDE_COUNT).direction).toBe(1);
    expect(goTo({ index: 2, direction: 1 }, 0, SLIDE_COUNT).direction).toBe(-1);
    expect(goTo(INITIAL_DECK_STATE, 99, SLIDE_COUNT).index).toBe(
      SLIDE_COUNT - 1,
    );
  });

  it("knows the last slide", () => {
    expect(isLastSlide(SLIDE_COUNT - 2, SLIDE_COUNT)).toBe(false);
    expect(isLastSlide(SLIDE_COUNT - 1, SLIDE_COUNT)).toBe(true);
  });
});

describe("segmentState", () => {
  it("maps each segment against the active index", () => {
    expect(segmentState(0, 1)).toBe("passed");
    expect(segmentState(1, 1)).toBe("active");
    expect(segmentState(2, 1)).toBe("upcoming");
  });
});

describe("resolveSwipe", () => {
  it("cancels a short slow drag", () => {
    expect(swipe(-30, 40)).toBe("cancel");
  });

  it("commits forward past the distance threshold", () => {
    expect(swipe(-120, 10)).toBe("forward");
  });

  it("commits backward past the distance threshold", () => {
    expect(swipe(120, -10)).toBe("backward");
  });

  it("commits on a short fast flick", () => {
    expect(swipe(-20, -800)).toBe("forward");
    expect(swipe(20, 800)).toBe("backward");
  });
});

describe("ONBOARDING_SLIDES", () => {
  it("holds three slides with unique illustrations", () => {
    expect(SLIDE_COUNT).toBe(3);
    const sources = ONBOARDING_SLIDES.map((s) => s.illustration.src);
    expect(new Set(sources).size).toBe(3);
  });

  it("only switches the call to action on the final slide", () => {
    expect(ONBOARDING_SLIDES[0].ctaLabel).toBe("Lanjut");
    expect(ONBOARDING_SLIDES[1].ctaLabel).toBe("Lanjut");
    expect(ONBOARDING_SLIDES[2].ctaLabel).toBe("Mulai Sekarang");
  });

  it("describes every illustration for screen readers", () => {
    for (const slide of ONBOARDING_SLIDES) {
      expect(slide.illustration.alt.length).toBeGreaterThan(10);
      expect(slide.illustration.width).toBeGreaterThan(0);
      expect(slide.illustration.height).toBeGreaterThan(0);
    }
  });
});
