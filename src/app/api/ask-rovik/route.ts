import { NextResponse } from "next/server";
import { askRovik, RovikServiceError } from "@/lib/ai";
import type {
  AskRovikRequest,
  DemoMode,
  RovikPersonality,
} from "@/lib/demo-types";

const validModes = new Set<DemoMode>([
  "email",
  "planning",
  "research",
  "general",
]);

const validPersonalities = new Set<RovikPersonality>([
  "professional",
  "friendly",
  "minimalist",
  "coach",
  "researcher",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AskRovikRequest>;
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    const mode =
      typeof body.mode === "string" && validModes.has(body.mode as DemoMode)
        ? (body.mode as DemoMode)
        : "general";
    const personality =
      typeof body.personality === "string" &&
      validPersonalities.has(body.personality as RovikPersonality)
        ? (body.personality as RovikPersonality)
        : "professional";
    const source = body.source === "voice" ? "voice" : "typed";

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required." },
        { status: 400 },
      );
    }

    const response = await askRovik({
      transcript,
      mode,
      personality,
      source,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof RovikServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Rovik could not complete the request." },
      { status: 500 },
    );
  }
}
