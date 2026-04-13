import type {
  ExamplePrompt,
  LandingCard,
  LandingMetric,
  PersonalityOption,
  RovikPersonality,
} from "@/lib/demo-types";

export const DEMO_BROWSER_HINT =
  process.env.NEXT_PUBLIC_DEMO_BROWSER_HINT ??
  "Voice input works best in Chrome and Microsoft Edge. Manual text input remains available everywhere.";

export const demoPrompts: ExamplePrompt[] = [
  {
    label: "Summarize this email",
    prompt:
      "Rovik, summarize this email draft and tell me the clearest next response.",
    mode: "email",
  },
  {
    label: "Draft a reply",
    prompt:
      "Rovik, draft a reply to a customer asking if we can deliver the prototype next week.",
    mode: "email",
  },
  {
    label: "Plan my day",
    prompt:
      "Rovik, plan my day tomorrow so I finish outreach, product review, and one deep work block.",
    mode: "planning",
  },
  {
    label: "Research this topic",
    prompt:
      "Rovik, research the best laptop for coding, compare the tradeoffs, and recommend one.",
    mode: "research",
  },
];

export const landingCards: LandingCard[] = [
  {
    title: "Voice to transcript",
    description:
      "Click the mic, speak a command, and watch the transcript populate in real time.",
  },
  {
    title: "Persistent conversation memory",
    description:
      "Follow-up questions stay connected because Rovik keeps the thread, rolling summary, and saved context together.",
  },
  {
    title: "Focused demo modes",
    description:
      "Email help, planning, and research cover the core behaviors without overloading the first version.",
  },
];

export const landingMetrics: LandingMetric[] = [
  { label: "Primary route", value: "/demo" },
  { label: "Voice input", value: "Web Speech API" },
  { label: "Memory", value: "Persistent thread" },
];

export const landingUseCases = [
  "Summarize an email draft",
  "Draft a reply",
  "Plan the day ahead",
  "Research a topic fast",
] as const;

export const defaultPersonality: RovikPersonality = "professional";

export const personalityOptions: PersonalityOption[] = [
  {
    id: "professional",
    title: "Professional",
    description: "Clear, calm, and efficient for work-focused tasks.",
    example:
      "Your inbox contains three priority messages. I’ve drafted replies for each.",
  },
  {
    id: "friendly",
    title: "Friendly",
    description: "Warm and conversational for everyday assistance.",
    example:
      "Looks like you’ve got a busy day! I can help organize your tasks.",
  },
  {
    id: "minimalist",
    title: "Minimalist",
    description: "Very short replies for power users who want only essentials.",
    example: "3 priority emails. Draft ready.",
  },
  {
    id: "coach",
    title: "Coach",
    description: "Motivating and action-oriented for momentum and focus.",
    example: "You’ve got two important tasks today. Let’s tackle them first.",
  },
  {
    id: "researcher",
    title: "Researcher",
    description: "Analytical and informative for deeper comparisons and learning.",
    example: "I found three strong options. Here’s a comparison.",
  },
];

export const rovikCopy = {
  name: "ROVIK",
  tagline: "Simply forward.",
  pitch:
    "A voice-first demo for Rovik, the proactive AI assistant that keeps conversation context, remembers follow-ups, and turns spoken requests into useful action.",
  demoTitle: "Speak a task. Keep the thread. Talk to Rovik.",
  demoDescription:
    "This version keeps the transcript editable, preserves follow-up context, compacts older turns automatically, and saves conversation memory for later use.",
};
