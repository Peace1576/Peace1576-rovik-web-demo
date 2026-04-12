export type DemoMode = "email" | "planning" | "research" | "general";

export type DemoState =
  | "idle"
  | "listening"
  | "processing"
  | "ready"
  | "error"
  | "unsupported";

export type AskRovikRequest = {
  transcript: string;
  mode: DemoMode;
  source: "voice" | "typed";
};

export type AskRovikResponse = {
  summary: string;
  recommendedAction: string;
  draft?: string;
  nextSteps?: string[];
  actionSuggestions?: string[];
  mode: DemoMode;
};

export type ExamplePrompt = {
  label: string;
  prompt: string;
  mode: Exclude<DemoMode, "general">;
};

export type LandingCard = {
  title: string;
  description: string;
};

export type LandingMetric = {
  label: string;
  value: string;
};
