"use client";

import type { ReactNode } from "react";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import { BrandLogo } from "./auth-chrome";

/**
 * Figma "Content": 24px gutters, 32px between the headline block and the
 * fields, with the footer link pinned to the bottom of the panel. The
 * register screen is taller than the viewport, so the panel scrolls rather
 * than compressing.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <AppPanel>
      <main
        id="main"
        className="flex flex-1 flex-col overflow-y-auto px-6 pt-6 pb-4"
      >
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-8">
            <BrandLogo />
            <div className="flex flex-col gap-3">
              <h1 className="text-[32px] leading-[1.3] font-bold tracking-[-0.64px] text-secondary-500">
                {title}
              </h1>
              <p className="text-xs leading-[1.25] font-semibold text-grey">
                {subtitle}
              </p>
            </div>
          </div>
          {children}
        </div>
        <div className="pt-8">{footer}</div>
      </main>
    </AppPanel>
  );
}

export function AuthFooterLink({
  prompt,
  action,
  onClick,
}: {
  prompt: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs font-semibold">
      <span className="text-subtle">{prompt}</span>
      <button
        type="button"
        onClick={onClick}
        className="rounded text-primary-500 transition-colors duration-150 ease-out can-hover:hover:text-primary-600"
      >
        {action}
      </button>
    </p>
  );
}

/**
 * Google/Facebook and password recovery are in the design but the backend has
 * no OAuth or reset endpoints, so the controls render in place and say so
 * rather than pretending to work.
 */
export function ComingSoonNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2" aria-describedby="coming-soon-note">
      {children}
      <p
        id="coming-soon-note"
        className="text-center text-[11px] text-placeholder"
      >
        Masuk dengan Facebook segera hadir.
      </p>
    </div>
  );
}
