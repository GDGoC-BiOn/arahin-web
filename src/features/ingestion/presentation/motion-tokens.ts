export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const PRESS = { duration: 0.14, ease: EASE_OUT } as const;
export const LABEL_SWAP = { duration: 0.18, ease: EASE_OUT } as const;
export const FADE = { duration: 0.28, ease: EASE_OUT } as const;

/** The progress bar. Spring, so a jump between phases still reads as travel. */
export const PROGRESS_SPRING = {
  type: "spring",
  duration: 0.6,
  bounce: 0,
} as const;

/** A step changing status. Short: several can land close together. */
export const STEP_SPRING = {
  type: "spring",
  duration: 0.42,
  bounce: 0.18,
} as const;

/** The failure sheet rising from the bottom edge it will leave by. */
export const SHEET_SPRING = {
  type: "spring",
  duration: 0.5,
  bounce: 0.14,
} as const;

/** How often the open-ended phases re-read elapsed time, in ms. */
export const PROGRESS_TICK_MS = 200;
