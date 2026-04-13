import { NextRequest, NextResponse } from "next/server";
import { askRovik, RovikServiceError } from "@/lib/ai";
import type {
  AskRovikRequest,
  DemoMode,
  RovikPersonality,
} from "@/lib/demo-types";
import {
  applySessionCookies,
  buildOwnerKey,
  getAuthSession,
  getConversationIdFromCookies,
  getGuestIdFromCookies,
  setConversationCookie,
  setGuestCookie,
} from "@/lib/auth";
import {
  createConversationMessage,
  createEmptyConversationRecord,
  loadConversationRecord,
  loadUserMemoryProfile,
  saveConversationRecord,
} from "@/lib/conversation-store";

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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<AskRovikRequest>;
    const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
    const requestedConversationId =
      typeof body.conversationId === "string" ? body.conversationId.trim() : "";
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

    const authSession = await getAuthSession(request.cookies);

    if (!authSession.user?.isAuthenticated) {
      return NextResponse.json(
        { error: "Sign in to use the Rovik demo." },
        { status: 401 },
      );
    }

    const guestId = getGuestIdFromCookies(request.cookies) ?? crypto.randomUUID();
    const conversationId =
      requestedConversationId ||
      getConversationIdFromCookies(request.cookies) ||
      crypto.randomUUID();
    const ownerKey = buildOwnerKey(authSession.user, guestId);

    let record =
      (await loadConversationRecord({
        ownerKey,
        conversationId,
      })) ??
      null;

    if (!record && authSession.user) {
      const guestRecord = await loadConversationRecord({
        ownerKey: `guests/${guestId}`,
        conversationId,
      });

      if (guestRecord) {
        record = {
          ...guestRecord,
          ownerKey,
        };
      }
    }

    const baseRecord =
      record ??
      createEmptyConversationRecord({
        conversationId,
        ownerKey,
      });

    const userMessage = createConversationMessage({
      role: "user",
      content: transcript,
      mode,
      personality,
    });
    const conversationMessages = [...baseRecord.messages, userMessage];
    const userMemory = await loadUserMemoryProfile(ownerKey);

    const aiResponse = await askRovik({
      transcript,
      mode,
      personality,
      source,
      conversation: conversationMessages,
      conversationSummary: baseRecord.summary,
      userMemory,
    });
    const assistantMessage = createConversationMessage({
      role: "assistant",
      content: aiResponse.draft?.trim() || aiResponse.summary,
      mode: aiResponse.mode,
      personality,
    });
    const savedRecord = await saveConversationRecord({
      ...baseRecord,
      ownerKey,
      archivedAt: undefined,
      summary: aiResponse.conversationSummary,
      messages: [...conversationMessages, assistantMessage],
    });

    const response = NextResponse.json({
      ...aiResponse,
      conversationId,
      userMessage,
      assistantMessage,
      messages: savedRecord.messages,
      userMemory,
    });
    applySessionCookies(response, authSession.session);
    setConversationCookie(response, conversationId);
    setGuestCookie(response, guestId);

    return response;
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
