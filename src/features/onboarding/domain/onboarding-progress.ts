/**
 * Which way the deck last travelled. Every transition reads this so the
 * outgoing and incoming slide move along the same axis instead of swapping
 * in place.
 */
export type SlideDirection = -1 | 0 | 1;

export type DeckState = {
  index: number;
  direction: SlideDirection;
};

export type SegmentState = "passed" | "active" | "upcoming";

export const INITIAL_DECK_STATE: DeckState = { index: 0, direction: 0 };

function clamp(index: number, count: number) {
  if (index < 0) return 0;
  const last = count - 1;
  return index > last ? last : index;
}

export function advance(state: DeckState, count: number): DeckState {
  const index = clamp(state.index + 1, count);
  // Keep the previous direction when clamped: a no-op must not re-trigger a
  // transition, and a direction of 0 would animate the slide from centre.
  if (index === state.index) return state;
  return { index, direction: 1 };
}

export function retreat(state: DeckState): DeckState {
  const index = clamp(state.index - 1, Number.POSITIVE_INFINITY);
  if (index === state.index) return state;
  return { index, direction: -1 };
}

export function goTo(
  state: DeckState,
  target: number,
  count: number,
): DeckState {
  const index = clamp(target, count);
  if (index === state.index) return state;
  return { index, direction: index > state.index ? 1 : -1 };
}

export function isLastSlide(index: number, count: number): boolean {
  return index >= count - 1;
}

export function segmentState(
  segmentIndex: number,
  activeIndex: number,
): SegmentState {
  if (segmentIndex < activeIndex) return "passed";
  if (segmentIndex === activeIndex) return "active";
  return "upcoming";
}

export type SwipeIntent = "forward" | "backward" | "cancel";

/**
 * Commit a drag once the finger lifts. Distance OR velocity is enough: a short
 * flick should count, so the gesture never feels like it swallowed the input.
 */
export function resolveSwipe(input: {
  offsetX: number;
  velocityX: number;
  viewportWidth: number;
  distanceRatio: number;
  velocityThreshold: number;
}): SwipeIntent {
  const {
    offsetX,
    velocityX,
    viewportWidth,
    distanceRatio,
    velocityThreshold,
  } = input;
  const travelled = Math.abs(offsetX) > viewportWidth * distanceRatio;
  const flicked = Math.abs(velocityX) > velocityThreshold;
  if (!travelled && !flicked) return "cancel";
  // Dragging left (negative offset) pulls the next slide in from the right.
  const pointsForward = (travelled ? offsetX : velocityX) < 0;
  return pointsForward ? "forward" : "backward";
}
