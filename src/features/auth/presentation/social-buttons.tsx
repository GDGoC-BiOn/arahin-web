"use client";

import { motion } from "motion/react";
import { PRESS } from "./motion-tokens";

const PROVIDERS = [
  { id: "google", label: "Lanjutkan dengan Google", icon: "/brand/google.svg" },
  {
    id: "facebook",
    label: "Lanjutkan dengan Facebook",
    icon: "/brand/facebook.svg",
  },
] as const;

export type SocialProvider = (typeof PROVIDERS)[number]["id"];

export function SocialButtons({
  onSelect,
  disabled,
  available = [],
}: {
  onSelect: (provider: SocialProvider) => void;
  disabled?: boolean;
  /** Providers that work today; the rest render inert. */
  available?: SocialProvider[];
}) {
  return (
    <div className="flex w-full flex-col gap-[15px]">
      {PROVIDERS.map((provider) => {
        const inert = disabled || !available.includes(provider.id);
        return (
          <motion.button
            key={provider.id}
            type="button"
            onClick={() => onSelect(provider.id)}
            disabled={inert}
            whileTap={inert ? undefined : { scale: 0.98 }}
            transition={PRESS}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-hairline bg-white px-6 text-sm font-bold text-secondary-500 shadow-[inset_0px_-3px_6px_0px_rgba(244,245,250,0.6)] transition-colors duration-150 ease-out disabled:opacity-60 can-hover:hover:bg-canvas/60"
          >
            {/* Brand marks render from their exported files and are never recoloured. */}
            <img
              src={provider.icon}
              alt=""
              width={18}
              height={18}
              className="size-[18px] shrink-0"
            />
            {provider.label}
          </motion.button>
        );
      })}
    </div>
  );
}
