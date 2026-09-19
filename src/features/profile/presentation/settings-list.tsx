"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import {
  BellIcon,
  ChevronRightIcon,
  CrownIcon,
  MoonIcon,
  UserOutlineIcon,
} from "@/shared/presentation/icons/profile-icons";
import { PRESS } from "./motion-tokens";

/**
 * Rows without a working destination render in place but inert, the same
 * treatment the Google/Facebook buttons get on the sign-in screen. Inert rows
 * deliberately get no press feedback. That absence is the signal.
 */
const INERT_ROWS = [
  { id: "premium", Icon: CrownIcon, label: "Upgrade to Premium" },
  { id: "dark", Icon: MoonIcon, label: "Dark Mode" },
] as const;

function RowShell({
  children,
  withBorder,
}: {
  children: ReactNode;
  withBorder: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-3.5 ${
        withBorder ? "border-b-[1.772px] border-[#f0f0f0]" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function SettingsList({
  signOutSlot,
  onEditProfile,
  onOpenNotifications,
  unreadNotifications,
}: {
  signOutSlot: ReactNode;
  onEditProfile: () => void;
  onOpenNotifications: () => void;
  unreadNotifications: number | null;
}) {
  return (
    <section aria-labelledby="settings-title" className="flex flex-col">
      <h2 id="settings-title" className="pb-3 text-base font-semibold text-ink">
        Settings
      </h2>

      <ul className="flex flex-col">
        {INERT_ROWS.map(({ id, Icon, label }) => (
          <li key={id}>
            <RowShell withBorder>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chip text-[#0f172a] opacity-40">
                <Icon className="size-4" />
              </span>
              <span className="flex-1 text-sm font-semibold text-[#1e293b] opacity-40">
                {label}
              </span>
              <span className="text-[11px] text-placeholder">segera hadir</span>
              <ChevronRightIcon className="size-4 shrink-0 text-[#c2c2c2] opacity-40" />
            </RowShell>
          </li>
        ))}
        <li>
          <SettingsRow
            icon={<BellIcon className="size-4" />}
            label="Notifications"
            onSelect={onOpenNotifications}
            trailing={
              unreadNotifications ? (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-[#e8395b] px-1.5 text-[11px] leading-5 font-bold text-white">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  <span className="sr-only"> belum dibaca</span>
                </span>
              ) : null
            }
          />
        </li>
        <li>
          <SettingsRow
            icon={<UserOutlineIcon className="size-4" />}
            label="Edit Profil Akun"
            onSelect={onEditProfile}
            withBorder={false}
          />
        </li>
      </ul>

      {/*
        Not in the Figma, added deliberately: replacing /beranda with the Home
        screen removed the app's only sign-out control, leaving no way to end a
        session. Profile is where it belongs.
      */}
      <div className="pt-2">{signOutSlot}</div>
    </section>
  );
}

/** An active settings row, kept for when these gain real destinations. */
export function SettingsRow({
  icon,
  label,
  onSelect,
  withBorder = true,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  onSelect: () => void;
  withBorder?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.99 }}
      transition={PRESS}
      className={`flex w-full items-center gap-3 py-3.5 text-left ${
        withBorder ? "border-b-[1.772px] border-[#f0f0f0]" : ""
      }`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chip text-[#0f172a]">
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold text-[#1e293b]">
        {label}
      </span>
      {trailing}
      <ChevronRightIcon className="size-4 shrink-0 text-[#c2c2c2]" />
    </motion.button>
  );
}
