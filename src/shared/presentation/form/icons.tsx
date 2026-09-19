/**
 * Path data lifted verbatim from the Figma exports (16x16 / 12x12 boxes,
 * 1.3 stroke). Inlined rather than served as files so they inherit
 * currentColor — the exported SVGs hardcode #ACB5BB, which is only correct
 * in the resting state.
 */

const STROKE = {
  fill: "none",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 shrink-0 stroke-current"
      aria-hidden="true"
    >
      <path
        {...STROKE}
        d="M7.05671 7.05794C6.8067 7.30804 6.66628 7.64721 6.66634 8.00085C6.6664 8.35448 6.80694 8.6936 7.05704 8.94361C7.30714 9.19362 7.64631 9.33404 7.99994 9.33398C8.35358 9.33392 8.6927 9.19338 8.94271 8.94328M11.1207 11.1154C10.1855 11.7005 9.1031 12.0073 8 12C5.6 12 3.6 10.6667 2 8.00002C2.848 6.58669 3.808 5.54802 4.88 4.88402M6.78667 4.12002C7.18603 4.03917 7.59254 3.99897 8 4.00002C10.4 4.00002 12.4 5.33335 14 8.00002C13.556 8.74002 13.0807 9.37802 12.5747 9.91335M2 2L14 14"
      />
    </svg>
  );
}

/**
 * The design system ships no "visible" counterpart to eye-off, so this keeps
 * that icon's own geometry: the same 2-14 bounds, stroke weight and family,
 * with the slash and the broken lid removed.
 */
export function EyeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 shrink-0 stroke-current"
      aria-hidden="true"
    >
      <path
        {...STROKE}
        d="M2 8C3.6 5.33333 5.6 4 8 4C10.4 4 12.4 5.33333 14 8C12.4 10.6667 10.4 12 8 12C5.6 12 3.6 10.6667 2 8Z"
      />
      <path
        {...STROKE}
        d="M6.66667 8C6.66667 7.26362 7.26362 6.66667 8 6.66667C8.73638 6.66667 9.33333 7.26362 9.33333 8C9.33333 8.73638 8.73638 9.33333 8 9.33333C7.26362 9.33333 6.66667 8.73638 6.66667 8Z"
      />
    </svg>
  );
}
