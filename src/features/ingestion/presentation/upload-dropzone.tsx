"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { PlusIcon } from "@/shared/presentation/icons";
import {
  ACCEPTED_LABELS,
  ACCEPTED_MIME_TYPES,
} from "../domain/upload-candidate";
import { FADE, PRESS } from "./motion-tokens";

export function UploadDropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file) onFile(file);
  }

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => input.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        if (!dragging) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      transition={PRESS}
      // The dashed edge tightening and the fill deepening is the only feedback
      // a drag gets — without it there is no way to tell the target is live.
      animate={{
        backgroundColor: dragging ? "#e2e8f0" : "#f1f5f9",
        borderColor: dragging ? "#3d6bec" : "#cbd5e1",
      }}
      className="flex w-full flex-col items-center gap-[18px] rounded-3xl border border-dashed px-11 py-6 disabled:opacity-60"
    >
      <motion.span
        animate={{ scale: dragging ? 1.08 : 1 }}
        transition={FADE}
        className="flex items-center justify-center rounded-full bg-[#f5f5f5] p-3 text-primary-600"
      >
        <PlusIcon className="size-6" />
      </motion.span>
      <span className="flex flex-col items-center gap-1">
        <span className="text-xl leading-[1.25] font-bold text-primary-500">
          Upload Document
        </span>
        <span className="text-center text-sm leading-[1.25] text-muted">
          Masukkan file di sini, atau ketuk untuk memilih file.
        </span>
      </span>
      <span className="flex items-center gap-2">
        {ACCEPTED_LABELS.map((label) => (
          <span
            key={label}
            className="flex h-6 items-center rounded-full bg-[#f5f5f5] px-3 text-xs font-semibold text-[#101010]"
          >
            {label}
          </span>
        ))}
      </span>
      <input
        ref={input}
        type="file"
        // Narrowed to what the parser genuinely accepts, so the picker cannot
        // offer a file that would be rejected after uploading.
        accept={ACCEPTED_MIME_TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </motion.button>
  );
}
