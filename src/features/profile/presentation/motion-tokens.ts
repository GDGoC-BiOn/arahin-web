export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const PRESS = { duration: 0.14, ease: EASE_OUT } as const;
export const FADE = { duration: 0.28, ease: EASE_OUT } as const;

/** Streak circles landing. The one celebratory moment on this screen. */
export const STREAK_SPRING = {
  type: "spring",
  duration: 0.4,
  bounce: 0.2,
} as const;

/** Delay between consecutive streak circles, in seconds. */
export const STREAK_STAGGER = 0.035;
