/**
 * Single source for every number the onboarding motion uses. The slide and the
 * progress bar deliberately share one spring family so they read as a single
 * movement — if the bar trailed the content the whole screen would feel broken.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const SLIDE_SPRING = {
  type: "spring",
  duration: 0.5,
  bounce: 0.15,
} as const;

export const PROGRESS_SPRING = {
  type: "spring",
  duration: 0.45,
  bounce: 0,
} as const;

export const PRESS = { duration: 0.14, ease: EASE_OUT } as const;
export const LABEL_SWAP = { duration: 0.18, ease: EASE_OUT } as const;
export const FADE_IN = { duration: 0.32, ease: EASE_OUT } as const;
export const SCREEN_EXIT = { duration: 0.22, ease: EASE_OUT } as const;

/** Horizontal travel for a slide entering or leaving, in px. */
export const SLIDE_OFFSET = 32;
/** Delay between illustration, title and subtitle, in seconds. */
export const STAGGER = 0.045;

/** Fraction of the viewport a drag must cover to commit. */
export const SWIPE_DISTANCE_RATIO = 0.25;
/** Flick speed that commits regardless of distance, in px/s. */
export const SWIPE_VELOCITY = 300;
/** How far past the first/last slide a drag may rubber-band. */
export const DRAG_ELASTIC = 0.18;
