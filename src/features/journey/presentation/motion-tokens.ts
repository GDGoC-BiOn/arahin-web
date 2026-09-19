export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const PRESS = { duration: 0.14, ease: EASE_OUT } as const;
export const FADE = { duration: 0.28, ease: EASE_OUT } as const;

/** The rail filling to the reached node, and the header bar. */
export const RAIL_SPRING = {
  type: "spring",
  duration: 0.7,
  bounce: 0,
} as const;

/** Nodes settling in as the rail passes them. */
export const NODE_SPRING = {
  type: "spring",
  duration: 0.45,
  bounce: 0.22,
} as const;

export const NODE_STAGGER = 0.06;
