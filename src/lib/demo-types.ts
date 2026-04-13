export type DemoMode = "email" | "planning" | "research" | "general";

export type RovikPersonality =
  | "professional"
  | "friendly"
  | "minimalist"
  | "coach"
  | "researcher";

export type DemoState =
  | "idle"
  | "listening"
  | "processing"
  | "ready"
  | "error"
  | "unsupported";

export type RovikExpression =
  | "idle"
  | "alert"
  | "listening"
  | "thinking"
  | "speaking"
  | "success"
  | "confused"
  | "error";

export type AskRovikRequest = {
  conversationId?: string;
  transcript: string;
  mode: DemoMode;
  personality: RovikPersonality;
  source: "voice" | "typed";
};

export type AskRovikResponse = {
  conversationId: string;
  summary: string;
  recommendedAction: string;
  draft?: string;
  nextSteps?: string[];
  actionSuggestions?: string[];
  mode: DemoMode;
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
  messages: ConversationMessage[];
  conversationSummary?: ConversationSummary;
  userMemory?: UserMemoryProfile;
};

export type ConversationRole = "user" | "assistant";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  createdAt: string;
  mode: DemoMode;
  personality?: RovikPersonality;
};

export type ConversationSummary = {
  snapshot: string;
  firstUserMessage?: string;
  keyFacts?: string[];
  preferences?: string[];
  openLoops?: string[];
  updatedAt: string;
  compactedThroughMessageId?: string;
};

export type UserMemoryProfile = {
  summary: string;
  facts?: string[];
  preferences?: string[];
  goals?: string[];
  updatedAt: string;
};

export type ConversationRecord = {
  conversationId: string;
  ownerKey: string;
  title: string;
  messages: ConversationMessage[];
  summary?: ConversationSummary;
  lastActiveAt: string;
  archivedAt?: string;
};

export type SessionUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  isAuthenticated: boolean;
};

export type ConversationSessionResponse = {
  conversationId: string;
  messages: ConversationMessage[];
  conversationSummary?: ConversationSummary;
  userMemory?: UserMemoryProfile;
  user: SessionUser | null;
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

export type PersonalityOption = {
  id: RovikPersonality;
  title: string;
  description: string;
  example: string;
};
