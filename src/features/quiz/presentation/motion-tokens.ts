export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const PRESS = { duration: 0.14, ease: EASE_OUT } as const;
export const OPTION_TINT = { duration: 0.14, ease: EASE_OUT } as const;
export const LABEL_SWAP = { duration: 0.18, ease: EASE_OUT } as const;
export const FADE = { duration: 0.24, ease: EASE_OUT } as const;

/** Question travel. The header bar shares this so they move as one. */
export const QUESTION_SPRING = {
  type: "spring",
  duration: 0.45,
  bounce: 0.12,
} as const;

/** The result card landing. */
export const MODAL_SPRING = {
  type: "spring",
  duration: 0.5,
  bounce: 0.15,
} as const;

/** The score bar filling, once the card has settled. */
export const SCORE_SPRING = {
  type: "spring",
  duration: 0.6,
  bounce: 0,
} as const;

/** Horizontal travel for a question entering or leaving, in px. */
export const QUESTION_OFFSET = 28;
/** Delay between option rows on a new question, in seconds. */
export const OPTION_STAGGER = 0.04;
