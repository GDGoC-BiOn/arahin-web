"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

/**
 * The Figma "Input Field" component: 12px grey label, 46px tall shell with a
 * 16px radius, 1px #edf1f3 border and a whisper of shadow, plus an optional
 * trailing adornment slot (eye toggle, calendar) and an optional leading slot
 * (the phone country picker).
 */
export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id"
> & {
  label: string;
  error?: string;
  hint?: string;
  adornment?: ReactNode;
  leading?: ReactNode;
};

export function TextField({
  label,
  error,
  hint,
  adornment,
  leading,
  ...input
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex w-full flex-col gap-0.5">
      <label
        htmlFor={id}
        className="flex h-[21px] items-center text-xs font-semibold text-grey"
      >
        {label}
      </label>
      <div
        className={`flex h-[46px] w-full items-center gap-2.5 overflow-hidden rounded-2xl border bg-white shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-primary-500 ${
          error ? "border-red-400" : "border-stroke"
        } ${leading ? "pr-3.5" : "px-3.5"}`}
      >
        {leading}
        {/*
          No explicit `ref` here on purpose: react-hook-form's `register()`
          returns one inside this spread, and declaring `ref` afterwards would
          overwrite it and silently break uncontrolled registration.
        */}
        <input
          {...input}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-secondary-500 outline-none placeholder:font-semibold placeholder:text-placeholder"
        />
        {adornment}
      </div>
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-grey">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
