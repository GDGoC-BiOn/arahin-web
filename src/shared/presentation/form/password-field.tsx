"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";
import { TextField, type TextFieldProps } from "./text-field";

type PasswordFieldProps = Omit<TextFieldProps, "type" | "adornment">;

export function PasswordField({
  showLabel = "Tampilkan kata sandi",
  hideLabel = "Sembunyikan kata sandi",
  ...props
}: PasswordFieldProps & { showLabel?: string; hideLabel?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      adornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // The label flips with the state so a screen reader hears the
          // action, not the current condition.
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-placeholder transition-colors duration-150 ease-out can-hover:hover:text-grey"
        >
          {visible ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      }
    />
  );
}
