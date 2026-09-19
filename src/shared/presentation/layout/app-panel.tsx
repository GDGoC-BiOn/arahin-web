import type { ReactNode } from "react";

/**
 * The phone-shaped panel every screen sits in.
 *
 * This was duplicated across six screens, which is exactly why it now lives in
 * one place: the frame size is a design decision that changes, and six copies
 * of it drift. Figma's frames moved from 375x812 to 390x852, so that number
 * appears here once.
 *
 * Below `sm` the panel is full-bleed — on a real phone the device *is* the
 * frame — and only becomes a floating card on larger screens.
 */
export function AppPanel({
  children,
  className = "",
  surface = "bg-white",
}: {
  children: ReactNode;
  /** Extra classes for the panel itself, not the page behind it. */
  className?: string;
  /** Some screens (quiz) use a tinted surface rather than white. */
  surface?: string;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas sm:p-8">
      <div
        className={`relative flex h-dvh w-full max-w-[390px] flex-col overflow-hidden ${surface} sm:h-[852px] sm:max-h-[calc(100dvh-4rem)] sm:rounded-[32px] sm:shadow-[0_24px_70px_-20px_rgba(14,26,50,0.28)] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
