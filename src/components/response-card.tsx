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
        <p className="text-base leading-7 text-white/82">{errorMessage}</p>
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

  const visibleResponse = response.draft?.trim() || response.summary.trim();

  return (
    <div className="rounded-[1.75rem] border border-[rgba(57,219,194,0.18)] bg-[linear-gradient(180deg,rgba(15,28,43,0.95),rgba(9,18,30,0.92))] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <p className="whitespace-pre-wrap text-base leading-8 text-white/84">
        {visibleResponse}
      </p>
    </div>
  );
}
