import Link from "next/link";
import { DemoShell } from "@/components/demo-shell";
import { RovikLogo } from "@/components/rovik-logo";

export default function DemoPage() {
  return (
    <main className="min-h-screen px-6 py-8 text-white md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-4">
            <RovikLogo className="h-auto w-28" title="Rovik logo" />
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                Voice demo
              </p>
              <p className="mt-1 text-sm text-white/62">
                Speak, review, and send a task to Rovik.
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/8"
          >
            Back to landing page
          </Link>
        </header>

        <DemoShell />
      </div>
    </main>
  );
}
