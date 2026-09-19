"use client";

import { motion } from "motion/react";
import { useCallback, useState } from "react";
import type { SlideIllustration as Illustration } from "../domain/onboarding-slide";
import { FADE_IN } from "./motion-tokens";

/**
 * The outer box reserves the designed geometry up front via aspect-ratio, so
 * the slide never reflows when the bitmap lands. The image itself only fades in
 * once it has decoded — an image that pops in half-painted mid-transition is
 * exactly the kind of severed state this screen is meant to avoid.
 *
 * `<img>` rather than next/image on purpose: dependency-cruiser's
 * `presentation-no-transport-clients` rule bars this layer from importing
 * `next`, and these are fixed-size local assets already encoded at 2x.
 */
export function SlideIllustration({
  illustration,
  priority,
}: {
  illustration: Illustration;
  priority: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  /**
   * A cached or already-decoded image finishes before React can attach
   * onLoad, and that event never fires again — which would leave the
   * illustration invisible. Read `complete` as the element mounts instead.
   */
  const measure = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true);
  }, []);

  return (
    <div
      className="mx-auto w-full"
      style={{
        // Each illustration keeps its own designed box (318x286, 319x319,
        // 286x286) instead of a shared width that would stretch two of three.
        maxWidth: illustration.width,
        aspectRatio: `${illustration.width} / ${illustration.height}`,
      }}
    >
      <motion.img
        ref={measure}
        src={illustration.src}
        alt={illustration.alt}
        width={illustration.width}
        height={illustration.height}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        initial={false}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={FADE_IN}
        className="h-full w-full select-none object-contain"
        draggable={false}
      />
    </div>
  );
}
