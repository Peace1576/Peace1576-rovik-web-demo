import type { AskRovikResponse, DemoState } from "@/lib/demo-types";

type ResponseCardProps = {
  response: AskRovikResponse | null;
  state: DemoState;
  errorMessage: string | null;
};

export function ResponseCard({
  response,
  state,
  errorMessage,
}: ResponseCardProps) {
  if (errorMessage) {
    return (
      <div className="rounded-[1.75rem] border border-[rgba(255,107,107,0.28)] bg-[rgba(74,20,26,0.55)] p-5 text-white">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Status</p>
        <p className="mt-3 text-lg font-medium">The request did not complete.</p>
        <p className="mt-2 text-sm leading-6 text-white/68">{errorMessage}</p>
      </div>
    );
  }

  if (state === "processing") {
    return (
      <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Status</p>
        <p className="mt-3 text-lg font-medium">Rovik is processing the request.</p>
        <p className="mt-2 text-sm leading-6 text-white/64">
          Generating a structured summary, recommendation, and next step.
        </p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-white/12 bg-white/4 p-5 text-white/68">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Response</p>
        <p className="mt-3 text-lg font-medium text-white">
          Nothing submitted yet.
        </p>
        <p className="mt-2 text-sm leading-6 text-white/58">
          Record or type a prompt, then send it to see Rovik’s structured output.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-[rgba(57,219,194,0.18)] bg-[linear-gradient(180deg,rgba(15,28,43,0.95),rgba(9,18,30,0.92))] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
            Rovik response
          </p>
          <p className="mt-2 text-lg font-medium">Response ready</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-[rgba(57,219,194,0.22)] bg-[rgba(57,219,194,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(177,245,232,0.92)]">
          {response.mode}
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        <SectionBlock title="Summary" body={response.summary} />
        <SectionBlock title="Recommended action" body={response.recommendedAction} />
        {response.draft ? <SectionBlock title="Draft" body={response.draft} /> : null}
        {response.nextSteps?.length ? (
          <ListBlock title="Next steps" items={response.nextSteps} />
        ) : null}
        {response.actionSuggestions?.length ? (
          <ListBlock title="Action suggestions" items={response.actionSuggestions} />
        ) : null}
      </div>
    </div>
  );
}

function SectionBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/8 bg-white/4 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/42">{title}</p>
      <p className="mt-3 text-sm leading-6 text-white/82">{body}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.25rem] border border-white/8 bg-white/4 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/42">{title}</p>
      <ul className="mt-3 grid gap-3 text-sm leading-6 text-white/82">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-2 w-2 rounded-full bg-[rgba(57,219,194,0.92)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
