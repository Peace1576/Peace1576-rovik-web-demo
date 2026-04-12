import type { ExamplePrompt } from "@/lib/demo-types";

type ExamplePromptsProps = {
  prompts: ExamplePrompt[];
  onSelect: (prompt: ExamplePrompt) => void;
};

export function ExamplePrompts({
  prompts,
  onSelect,
}: ExamplePromptsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {prompts.map((prompt) => (
        <button
          key={prompt.label}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(57,219,194,0.3)] hover:bg-white/7"
        >
          <div className="text-xs uppercase tracking-[0.22em] text-white/42">
            {prompt.mode}
          </div>
          <div className="mt-2 text-base font-medium text-white">
            {prompt.label}
          </div>
          <p className="mt-2 text-sm leading-6 text-white/58">{prompt.prompt}</p>
        </button>
      ))}
    </div>
  );
}
