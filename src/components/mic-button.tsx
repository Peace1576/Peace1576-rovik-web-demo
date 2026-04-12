import type { DemoState } from "@/lib/demo-types";

type MicButtonProps = {
  state: DemoState;
  disabled: boolean;
  onClick: () => void;
};

const stateLabel: Record<DemoState, string> = {
  idle: "Start voice input",
  listening: "Stop listening",
  processing: "Processing request",
  ready: "Start another voice input",
  error: "Retry voice input",
  unsupported: "Voice input unavailable",
};

export function MicButton({ state, disabled, onClick }: MicButtonProps) {
  const isListening = state === "listening";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={stateLabel[state]}
      className={[
        "group relative flex h-20 w-20 items-center justify-center rounded-full border transition duration-200",
        disabled
          ? "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
          : isListening
            ? "border-[rgba(57,219,194,0.5)] bg-[radial-gradient(circle_at_30%_30%,rgba(57,219,194,0.45),rgba(12,27,42,0.95))] text-white shadow-[0_0_0_12px_rgba(57,219,194,0.08)]"
            : "border-white/12 bg-white/8 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:bg-white/10",
        isListening ? "rovik-mic-pulse" : "",
      ].join(" ")}
    >
      <span
        className={[
          "absolute inset-0 rounded-full border border-transparent transition duration-200",
          isListening ? "border-[rgba(57,219,194,0.35)]" : "",
        ].join(" ")}
      />
      <span className="relative block h-7 w-5 rounded-full border-[3px] border-current">
        <span className="absolute inset-x-1 bottom-1 top-1 rounded-full bg-current opacity-80" />
        <span className="absolute left-1/2 top-full h-3 w-[3px] -translate-x-1/2 rounded-full bg-current" />
        <span className="absolute left-1/2 top-[calc(100%+0.65rem)] h-[3px] w-5 -translate-x-1/2 rounded-full bg-current" />
      </span>
    </button>
  );
}
