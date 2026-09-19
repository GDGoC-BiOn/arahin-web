export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const PRESS = { duration: 0.14, ease: EASE_OUT } as const;
export const LABEL_SWAP = { duration: 0.18, ease: EASE_OUT } as const;
/**
 * Deliberately no entrance stagger for the fields. Sign-in is a task users
 * return to, not a showcase: animating a form in makes it feel slow when all
 * someone wants to do is start typing. The budget goes to the error alert and
 * the submit state instead.
 */
export const ALERT_SPRING = {
  type: "spring",
  duration: 0.4,
  bounce: 0.12,
} as const;
