"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  advance,
  type DeckState,
  goTo,
  INITIAL_DECK_STATE,
  isLastSlide,
  resolveSwipe,
  retreat,
} from "../domain/onboarding-progress";
import type { OnboardingDeck } from "../domain/onboarding-slide";
import { SWIPE_DISTANCE_RATIO, SWIPE_VELOCITY } from "./motion-tokens";

type DeckAction =
  | { type: "advance"; count: number }
  | { type: "retreat" }
  | { type: "goTo"; index: number; count: number };

function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case "advance":
      return advance(state, action.count);
    case "retreat":
      return retreat(state);
    case "goTo":
      return goTo(state, action.index, action.count);
  }
}

export type SlideDeck = ReturnType<typeof useSlideDeck>;

export function useSlideDeck(options: {
  slides: OnboardingDeck;
  onComplete: () => void;
}) {
  const { slides, onComplete } = options;
  const count = slides.length;
  const [state, dispatch] = useReducer(deckReducer, INITIAL_DECK_STATE);
  const [handedOff, setHandedOff] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const finishing = useRef(false);

  const slide = slides[state.index] ?? slides[0];
  const isLast = isLastSlide(state.index, count);

  // Fetch the next illustration while the current slide is being read, so a
  // transition never carries a half-painted image.
  useEffect(() => {
    const next = slides[state.index + 1];
    if (!next) return;
    const image = new Image();
    image.src = next.illustration.src;
  }, [slides, state.index]);

  const goNext = useCallback(() => {
    dispatch({ type: "advance", count });
  }, [count]);

  const goPrevious = useCallback(() => {
    dispatch({ type: "retreat" });
  }, []);

  const jumpTo = useCallback(
    (index: number) => {
      dispatch({ type: "goTo", index, count });
    },
    [count],
  );

  /**
   * The last tap hands off to another route. Holding a pending state until the
   * navigation actually starts is what keeps the gap between tap and next
   * screen from showing as a dead frame.
   */
  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    // Flip the pending state in the same frame as the tap, then let the
    // transition report how long the destination actually takes.
    setHandedOff(true);
    startNavigation(() => {
      onComplete();
    });
  }, [onComplete]);

  const activatePrimary = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    goNext();
  }, [finish, goNext, isLast]);

  const commitSwipe = useCallback(
    (input: { offsetX: number; velocityX: number; viewportWidth: number }) => {
      const intent = resolveSwipe({
        ...input,
        distanceRatio: SWIPE_DISTANCE_RATIO,
        velocityThreshold: SWIPE_VELOCITY,
      });
      if (intent === "forward") goNext();
      if (intent === "backward") goPrevious();
    },
    [goNext, goPrevious],
  );

  return {
    index: state.index,
    direction: state.direction,
    count,
    slide,
    isLast,
    isFinishing: handedOff || isNavigating,
    activatePrimary,
    goNext,
    goPrevious,
    jumpTo,
    commitSwipe,
  };
}
