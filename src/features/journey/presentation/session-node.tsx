"use client";

import { motion } from "motion/react";
import { CheckLargeIcon, LockIcon } from "@/shared/presentation/icons";
import type { TimelineSession } from "../domain/session";
import { NODE_SPRING, NODE_STAGGER, PRESS } from "./motion-tokens";

/**
 * One node on the rail, laid out as a three-column grid with the circle always
 * in the middle cell. That is what keeps every node centred on the rail no
 * matter which side its label sits on — a flex row would drift as labels
 * change width.
 *
 * The design gives reached nodes a thick light ring that locked ones lack,
 * which is what makes progress readable without reading any labels.
 */
export function SessionNode({
  session,
  index,
  onOpen,
}: {
  session: TimelineSession;
  index: number;
  onOpen: (session: TimelineSession) => void;
}) {
  const reached = session.status !== "locked";
  const locked = session.status === "locked";

  return (
    <div className="grid grid-cols-[1fr_64px_1fr] items-center gap-5">
      <span className={session.side === "left" ? "contents" : ""}>
        {session.side === "left" ? (
          <SessionLabel session={session} align="right" />
        ) : (
          <span />
        )}
      </span>

      {/*
        Entrance and press are separate elements on purpose: one spring owns
        the staggered arrival, the button owns the crisp tap. Sharing a single
        `transition` would make every tap bounce like an entrance.
      */}
      <motion.span
        className="col-start-2"
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...NODE_SPRING, delay: index * NODE_STAGGER }}
      >
        <motion.button
          type="button"
          onClick={() => onOpen(session)}
          disabled={locked}
          aria-label={`Sesi ${session.position}: ${session.title}${
            locked ? " (terkunci)" : ""
          }`}
          whileTap={locked ? undefined : { scale: 0.95 }}
          transition={PRESS}
          className={`flex size-16 items-center justify-center rounded-[32px] disabled:cursor-not-allowed ${
            reached
              ? "border-[7px] border-[#d9defb] bg-primary-500 text-[#f8fafc]"
              : "border border-[#cbd5e1] bg-[#f1f5f9] text-subtle"
          }`}
        >
          {/*
            The design only draws "done" and "locked". A third state is
            unavoidable — with nothing finished, every node would be locked and
            there would be no way in — so the next session reads as "you are
            here": the reached styling, but a dot rather than a check, which
            would claim work that has not happened.
          */}
          {session.status === "done" ? (
            <CheckLargeIcon className="size-[26px]" />
          ) : session.status === "current" ? (
            <span className="block size-3 rounded-full bg-white" />
          ) : (
            <LockIcon className="size-[22px]" />
          )}
        </motion.button>
      </motion.span>

      {session.side === "right" ? (
        <SessionLabel session={session} align="left" />
      ) : (
        <span />
      )}
    </div>
  );
}

function SessionLabel({
  session,
  align,
}: {
  session: TimelineSession;
  align: "left" | "right";
}) {
  const reached = session.status !== "locked";
  return (
    <span
      className={`flex flex-col gap-px ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span
        className={`text-sm leading-[1.25] font-bold ${
          reached ? "text-primary-500" : "text-[#9ca3af]"
        }`}
      >
        Sesi {session.position}
      </span>
      <span
        className={`text-xs leading-[1.25] ${
          reached ? "text-subtle" : "text-[#9ca3af]"
        }`}
      >
        {session.title}
      </span>
    </span>
  );
}
