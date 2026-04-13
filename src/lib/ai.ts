import type {
  AskRovikRequest,
  AskRovikResponse,
  DemoMode,
  RovikPersonality,
} from "@/lib/demo-types";

type ProviderErrorPayload = {
  error?: {
    code?: number | string;
    message?: string;
    type?: string;
  };
};

type ChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

export class RovikServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "RovikServiceError";
  }
}

function readEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

const apiUrl =
  readEnv("GROQ_API_URL", "AI_API_URL") ||
  "https://api.groq.com/openai/v1/chat/completions";

const apiKey = readEnv("GROQ_API_KEY", "AI_API_KEY");
const model =
  readEnv("GROQ_MODEL", "AI_MODEL") || "llama-3.3-70b-versatile";

const systemInstruction = [
  "You are Rovik, a proactive AI assistant.",
  "Your job is to help with tasks, planning, drafting, and research in a direct, useful way.",
  "Never mention the underlying AI provider, API, or model.",
  "For simple greetings or short conversational prompts, answer naturally instead of describing the user's intent.",
  "If the request is unclear, ask a short clarifying question.",
  "Return JSON only.",
  "Use exactly this shape:",
  '{',
  '  "summary": "Primary user-facing answer text.",',
  '  "recommendedAction": "One concrete next action.",',
  '  "draft": "Optional longer answer or draft. Omit when unnecessary.",',
  '  "nextSteps": ["Optional next step", "Optional next step"],',
  '  "actionSuggestions": ["Optional action", "Optional action"],',
  '  "mode": "email | planning | research | general"',
  '}',
  "Do not wrap the JSON in markdown fences.",
].join(" ");

function buildModeInstruction(mode: DemoMode) {
  switch (mode) {
    case "email":
      return "Focus on inbox help, summaries, reply drafts, and clear message handling.";
    case "planning":
      return "Focus on scheduling, priorities, sequencing, and a realistic plan.";
    case "research":
      return "Focus on comparison, tradeoffs, reasoning, and concise synthesis.";
    default:
      return "Handle the request like a general assistant while staying action-oriented.";
  }
}

function buildPersonalityInstruction(personality: RovikPersonality) {
  switch (personality) {
    case "friendly":
      return "Tone: warm, conversational, and encouraging. Keep the wording simple.";
    case "minimalist":
      return "Tone: extremely concise. Use only the essential information and avoid extra commentary.";
    case "coach":
      return "Tone: motivating and helpful. Push toward action and momentum.";
    case "researcher":
      return "Tone: analytical and informative. Favor structured comparisons and reasoning.";
    default:
      return "Tone: professional, clear, calm, and efficient.";
  }
}

function extractJson(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

function extractMessageContent(
  payload: ChatCompletionPayload,
) {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

function normalizeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : undefined;
}

function normalizeMode(value: unknown): DemoMode {
  if (
    value === "email" ||
    value === "planning" ||
    value === "research" ||
    value === "general"
  ) {
    return value;
  }

  return "general";
}

function normalizeResponse(value: unknown): AskRovikResponse {
  if (!value || typeof value !== "object") {
    throw new RovikServiceError(
      "Rovik returned an unreadable response. Please try again.",
      502,
    );
  }

  const candidate = value as Record<string, unknown>;
  const summary =
    typeof candidate.summary === "string" && candidate.summary.trim()
      ? candidate.summary.trim()
      : typeof candidate.draft === "string" && candidate.draft.trim()
        ? candidate.draft.trim()
        : "";

  if (!summary) {
    throw new RovikServiceError(
      "Rovik returned an empty response. Please try again.",
      502,
    );
  }

  const recommendedAction =
    typeof candidate.recommendedAction === "string" &&
    candidate.recommendedAction.trim()
      ? candidate.recommendedAction.trim()
      : "Review the response and continue with the next step.";

  const draft =
    typeof candidate.draft === "string" && candidate.draft.trim()
      ? candidate.draft.trim()
      : undefined;

  return {
    summary,
    recommendedAction,
    draft,
    nextSteps: normalizeArray(candidate.nextSteps),
    actionSuggestions: normalizeArray(candidate.actionSuggestions),
    mode: normalizeMode(candidate.mode),
  };
}

async function parseProviderError(response: Response) {
  let payload: ProviderErrorPayload | null = null;

  try {
    payload = (await response.json()) as ProviderErrorPayload;
  } catch {
    payload = null;
  }

  const providerMessage = payload?.error?.message?.trim();

  if (response.status === 401 || response.status === 403) {
    return new RovikServiceError(
      "Rovik is not configured correctly right now. Check the server API key.",
      500,
    );
  }

  if (response.status === 429 || response.status === 503) {
    return new RovikServiceError(
      "Rovik is temporarily busy right now. Please try again in a moment.",
      503,
    );
  }

  return new RovikServiceError(
    providerMessage || "Rovik could not complete the request.",
    response.status || 500,
  );
}

export async function askRovik({
  transcript,
  mode,
  personality,
  source,
}: AskRovikRequest): Promise<AskRovikResponse> {
  if (!apiKey) {
    throw new RovikServiceError(
      "Missing Groq API key. Set GROQ_API_KEY or AI_API_KEY.",
      500,
    );
  }

  const userInstruction = [
    `Mode: ${mode}`,
    `Personality: ${personality}`,
    `Source: ${source}`,
    buildModeInstruction(mode),
    buildPersonalityInstruction(personality),
    `User request: ${transcript}`,
  ].join("\n");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.45,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: systemInstruction,
        },
        {
          role: "user",
          content: userInstruction,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw await parseProviderError(response);
  }

  const payload = (await response.json()) as ChatCompletionPayload;
  const content = extractMessageContent(payload);

  if (!content) {
    throw new RovikServiceError(
      "Rovik returned an empty response. Please try again.",
      502,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJson(content));
  } catch {
    throw new RovikServiceError(
      "Rovik returned an unreadable response. Please try again.",
      502,
    );
  }

  return normalizeResponse(parsed);
}
