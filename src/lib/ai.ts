import { GoogleGenAI } from "@google/genai";
import type { AskRovikRequest, AskRovikResponse, DemoMode } from "@/lib/demo-types";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
- Use short arrays for nextSteps and actionSuggestions when helpful.
- Include draft only when the request would benefit from wording the user can reuse.
- Do not wrap JSON in markdown fences.
- Match the requested mode unless the request is obviously better treated as "general".`;

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
    throw new Error(
      "Missing Gemini API key. Set GOOGLE_API_KEY or GEMINI_API_KEY.",
    );
  }

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
              `Input source: ${input.source}`,
              buildModeInstruction(input.mode),
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
}
