"use client";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-0.5">
      <img
        src="/brand/arahin-logomark.svg"
        alt=""
        width={22}
        height={16}
        className="h-4 w-[22px] shrink-0"
      />
      <span className="text-lg leading-[1.2] font-medium text-primary-600">
        rahin
      </span>
      <span className="sr-only">Arahin</span>
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex w-full items-center gap-4">
      <span className="h-px flex-1 bg-stroke" />
      <span className="text-xs font-semibold text-grey">{label}</span>
      <span className="h-px flex-1 bg-stroke" />
    </div>
  );
}
