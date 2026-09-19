import Link from "next/link";
import { AppPanel } from "@/shared/presentation/layout/app-panel";

/** The shared dead end for a signed-in URL that points at nothing of yours. */
export function NotFoundPanel({
  title,
  message,
  backHref,
}: {
  title: string;
  message: string;
  backHref: string;
}) {
  return (
    <AppPanel>
      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <h1 className="text-base font-bold text-ink">{title}</h1>
        <p className="text-xs leading-[1.5] text-subtle">{message}</p>
        <Link
          href={backHref}
          className="rounded-[20px] bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Kembali
        </Link>
      </main>
    </AppPanel>
  );
}
