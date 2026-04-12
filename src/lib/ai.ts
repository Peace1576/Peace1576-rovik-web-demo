import { GoogleGenAI } from "@google/genai";
import type {
  AskRovikRequest,
  AskRovikResponse,
  DemoMode,
  RovikPersonality,
} from "@/lib/demo-types";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export class RovikServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "RovikServiceError";
    this.statusCode = statusCode;
  }
}

const systemInstruction = `You are Rovik, a proactive AI assistant.
You help users manage tasks, research information, draft responses, and plan actions.
Be clear, concise, and action-oriented.
Return valid JSON only with this exact shape:
{
  "summary": string,
  "recommendedAction": string,
  "draft": string | undefined,
  "nextSteps": string[] | undefined,
  "actionSuggestions": string[] | undefined,
  "mode": "email" | "planning" | "research" | "general"
}
Rules:
- Always include summary, recommendedAction, and mode.
- Write summary as the direct response shown to the user. Do not describe the user's prompt from a third-person perspective.
- For greetings or simple conversational input, answer naturally and briefly as Rovik.
- Use short arrays for nextSteps and actionSuggestions when helpful.
- Include draft only when the request would benefit from wording the user can reuse.
- Do not wrap JSON in markdown fences.
- Match the requested mode unless the request is obviously better treated as "general".
- Match the requested personality in tone, pacing, and wording.`;

function getApiKey() {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
}

function buildModeInstruction(mode: DemoMode) {
  if (mode === "email") {
    return "Focus on email clarity, priorities, and usable reply language.";
  }

  if (mode === "planning") {
    return "Focus on prioritization, sequencing, and a practical schedule.";
  }

  if (mode === "research") {
    return "Focus on comparison, recommendation quality, and concise tradeoffs.";
  }

  return "Handle the request as a general proactive assistant task.";
}

function buildPersonalityInstruction(personality: RovikPersonality) {
  if (personality === "professional") {
    return [
      "Professional mode.",
      "Be clear, calm, efficient, and business-like.",
      "Prefer structured, concise wording.",
      "Avoid casual filler.",
    ].join(" ");
  }

  if (personality === "friendly") {
    return [
      "Friendly mode.",
      "Be warm, conversational, and easy to follow.",
      "Use encouraging language without sounding informal to the point of being sloppy.",
    ].join(" ");
  }

  if (personality === "minimalist") {
    return [
      "Minimalist mode.",
      "Keep the response extremely concise.",
      "Use only the key information needed to move the user forward.",
      "Avoid extra commentary.",
    ].join(" ");
  }

  if (personality === "coach") {
    return [
      "Coach mode.",
      "Be motivating, helpful, and action-oriented.",
      "Encourage progress and suggest the next productive move.",
    ].join(" ");
  }

  return [
    "Researcher mode.",
    "Be analytical, informative, and structured.",
    "Explain tradeoffs clearly and favor precise comparisons.",
  ].join(" ");
}

function extractJson(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Gemini returned a non-JSON response.");
}

function normalizeProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (/503|UNAVAILABLE|overloaded|high demand/i.test(message)) {
    return new RovikServiceError(
      "Rovik is temporarily busy right now. Please try again in a moment.",
      503,
    );
  }

  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(message)) {
    return new RovikServiceError(
      "Rovik is handling too many requests right now. Please try again shortly.",
      429,
    );
  }

  if (/API key|credential|permission/i.test(message)) {
    return new RovikServiceError(
      "The AI service is not configured correctly right now.",
      500,
    );
  }

  return new RovikServiceError(
    "Rovik hit a temporary issue while generating a response. Please try again.",
    500,
  );
}

function normalizeResponse(
  payload: Partial<AskRovikResponse>,
  fallbackMode: DemoMode,
): AskRovikResponse {
  const mode = payload.mode ?? fallbackMode;

  return {
    summary: typeof payload.summary === "string" ? payload.summary.trim() : "",
    recommendedAction:
      typeof payload.recommendedAction === "string"
        ? payload.recommendedAction.trim()
        : "",
    draft: typeof payload.draft === "string" ? payload.draft.trim() : undefined,
    nextSteps: Array.isArray(payload.nextSteps)
      ? payload.nextSteps
          .filter((step): step is string => typeof step === "string")
          .map((step) => step.trim())
          .filter(Boolean)
      : undefined,
    actionSuggestions: Array.isArray(payload.actionSuggestions)
      ? payload.actionSuggestions
          .filter((step): step is string => typeof step === "string")
          .map((step) => step.trim())
          .filter(Boolean)
      : undefined,
    mode,
  };
}

export async function askRovik(
  input: AskRovikRequest,
): Promise<AskRovikResponse> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new RovikServiceError(
      "Missing Gemini API key. Set GOOGLE_API_KEY or GEMINI_API_KEY.",
      500,
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                `Mode: ${input.mode}`,
                `Personality: ${input.personality}`,
                `Input source: ${input.source}`,
                buildModeInstruction(input.mode),
                buildPersonalityInstruction(input.personality),
                "",
                "User transcript:",
                input.transcript.trim(),
              ].join("\n"),
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.6,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text ?? "";
    const parsed = JSON.parse(extractJson(rawText)) as Partial<AskRovikResponse>;
    const normalized = normalizeResponse(parsed, input.mode);

    if (!normalized.summary || !normalized.recommendedAction) {
      throw new Error("Gemini response was missing required fields.");
    }

    return normalized;
  } catch (error) {
    throw normalizeProviderError(error);
  }
}
