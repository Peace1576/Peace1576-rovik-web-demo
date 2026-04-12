import Link from "next/link";
import { RovikLogo } from "@/components/rovik-logo";
import {
  DEMO_BROWSER_HINT,
  landingCards,
  landingMetrics,
  landingUseCases,
  rovikCopy,
} from "@/lib/demo-content";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 text-white md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <RovikLogo className="h-auto w-28" title="Rovik logo" />
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                Product demo
              </p>
              <p className="mt-1 text-sm text-white/60">
                Voice input, editable transcript, structured AI response.
              </p>
            </div>
          </div>

          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#39dbc2_0%,#0f8a7b_100%)] px-5 py-3 text-sm font-semibold text-[#04131d] transition duration-200 hover:-translate-y-0.5"
          >
            Open demo
          </Link>
        </header>

        <section className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,16,27,0.92),rgba(6,12,22,0.98))] p-7 shadow-[0_30px_90px_rgba(2,8,17,0.3)] md:p-9">
            <p className="text-xs uppercase tracking-[0.26em] text-white/42">
              Rovik web demo
            </p>
            <h1 className="mt-4 max-w-3xl text-[clamp(3rem,8vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-white">
              Turn spoken tasks into clean, usable actions.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/64">
              {rovikCopy.pitch}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#39dbc2_0%,#0f8a7b_100%)] px-5 py-3 text-sm font-semibold text-[#04131d] transition duration-200 hover:-translate-y-0.5"
              >
                Launch voice demo
              </Link>
              <a
                href="mailto:mwambatchishi@gmail.com"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/8"
              >
                Contact founder
              </a>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/46">
              {DEMO_BROWSER_HINT}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {landingMetrics.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">
                    {metric.value}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <article className="rounded-[2rem] border border-white/10 bg-white/6 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                Demo scope
              </p>
              <div className="mt-5 grid gap-4">
                {landingCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-[1.35rem] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4"
                  >
                    <h2 className="text-lg font-semibold text-white">
                      {card.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-[rgba(57,219,194,0.14)] bg-[linear-gradient(180deg,rgba(8,21,34,0.88),rgba(5,15,26,0.94))] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                    Supported prompts
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    The first version stays narrow on purpose.
                  </p>
                </div>
                <span className="rounded-full border border-[rgba(57,219,194,0.18)] bg-[rgba(57,219,194,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(177,245,232,0.92)]">
                  Phase 1
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {landingUseCases.map((useCase) => (
                  <div
                    key={useCase}
                    className="flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-[rgba(57,219,194,0.92)]" />
                    <span className="text-sm leading-6 text-white/76">
                      {useCase}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.35rem] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                  Example flow
                </p>
                <p className="mt-3 text-base leading-7 text-white/72">
                  User says: &quot;Rovik, plan my day tomorrow.&quot; The transcript
                  appears, stays editable, then Gemini returns a schedule, top
                  priorities, and recommended next actions.
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
