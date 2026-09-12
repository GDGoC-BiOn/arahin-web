import { TasksFeature } from "@/features/tasks/composition.client";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-10">
      <header className="flex h-24 items-center justify-between border-b border-stone-200/80">
        <a
          href="/"
          aria-label="ArahIn home"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white"
          >
            ↗
          </span>
          ArahIn<span className="text-emerald-700">.</span>
        </a>
        <span className="rounded-full border border-stone-200 bg-white/60 px-3 py-1.5 text-xs text-stone-600">
          A little more direction
        </span>
      </header>
      <main id="main" className="pb-16 pt-12 sm:pt-16">
        <div className="mb-12 max-w-2xl">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-700"
            />
            Space to move forward
          </p>
          <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.045em] sm:text-6xl">
            Big things.
            <br />
            <span className="font-serif font-normal italic text-emerald-800">
              Small beginnings.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-stone-600">
            Get it out of your head and into motion. A calm little home for
            everything you want to do next.
          </p>
        </div>
        <TasksFeature />
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 py-6 text-xs leading-5 text-stone-500">
        <p>ArahIn — find your direction.</p>
        <p>Demo workspace · Tasks reset when the server restarts.</p>
      </footer>
    </div>
  );
}
