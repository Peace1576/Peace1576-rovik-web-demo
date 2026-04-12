import type { ChangeEventHandler } from "react";
import type { DemoMode, DemoState } from "@/lib/demo-types";

type TranscriptBoxProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  state: DemoState;
  mode: DemoMode;
};

const modeLabels: Record<DemoMode, string> = {
  email: "Email help",
  planning: "Planning",
  research: "Research",
  general: "General",
};

export function TranscriptBox({
  value,
  onChange,
  state,
  mode,
}: TranscriptBoxProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[rgba(11,20,34,0.86)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
            Transcript
          </p>
          <p className="mt-2 text-sm text-white/64">
            Spoken words stay editable before you send them to Rovik.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full border border-[rgba(57,219,194,0.22)] bg-[rgba(57,219,194,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(177,245,232,0.92)]">
          {modeLabels[mode]}
        </span>
      </div>

      <textarea
        value={value}
        onChange={onChange}
        placeholder="Try: Rovik, plan my day tomorrow."
        className="mt-5 min-h-40 w-full resize-none rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.04)] px-4 py-4 text-base leading-7 text-white outline-none transition focus:border-[rgba(57,219,194,0.45)] focus:bg-[rgba(255,255,255,0.06)]"
      />

      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-white/45">
        <span>
          {state === "listening"
            ? "Listening now. Pause or press the mic again to stop."
            : "Edit anything the browser transcribed incorrectly before sending."}
        </span>
        <span>{value.trim() ? `${value.trim().split(/\s+/).length} words` : "0 words"}</span>
      </div>
    </div>
  );
}
