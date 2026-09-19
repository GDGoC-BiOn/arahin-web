"use client";

import { motion } from "motion/react";
import { CheckLargeIcon } from "@/shared/presentation/icons";
import { AuthButton } from "./auth-button";

/** The settled state both reset screens land on: a mark, a line, one action. */
export function PasswordResetDone({
  body,
  action,
  onAction,
}: {
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.12 }}
      className="flex flex-col items-center gap-6 text-center"
      role="status"
    >
      <span className="flex size-16 items-center justify-center rounded-full border-[10px] border-primary-100 bg-primary-500 text-white">
        <CheckLargeIcon className="size-6" />
      </span>
      <p className="text-sm leading-[1.5] text-subtle">{body}</p>
      <div className="w-full">
        <AuthButton
          type="button"
          label={action}
          pendingLabel={action}
          pending={false}
          onClick={onAction}
        />
      </div>
    </motion.div>
  );
}
