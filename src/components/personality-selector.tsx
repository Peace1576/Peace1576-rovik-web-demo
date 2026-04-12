import type { PersonalityOption, RovikPersonality } from "@/lib/demo-types";

type PersonalitySelectorProps = {
  options: PersonalityOption[];
  selected: RovikPersonality;
  onSelect: (personality: RovikPersonality) => void;
};

export function PersonalitySelector({
  options,
  selected,
  onSelect,
}: PersonalitySelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      {options.map((option) => {
        const isSelected = option.id === selected;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            aria-pressed={isSelected}
            className={`rounded-[1.25rem] border px-4 py-4 text-left transition duration-200 ${
              isSelected
                ? "border-[rgba(57,219,194,0.32)] bg-[rgba(57,219,194,0.11)] shadow-[0_0_0_1px_rgba(57,219,194,0.12)]"
                : "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:border-[rgba(57,219,194,0.24)] hover:bg-white/7"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-medium text-white">
                {option.title}
              </span>
              {isSelected ? (
                <span className="rounded-full border border-[rgba(57,219,194,0.26)] bg-[rgba(57,219,194,0.14)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[rgba(177,245,232,0.92)]">
                  Active
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-white/62">
              {option.description}
            </p>
            <p className="mt-3 text-sm leading-6 text-white/46">
              {option.example}
            </p>
          </button>
        );
      })}
    </div>
  );
}
