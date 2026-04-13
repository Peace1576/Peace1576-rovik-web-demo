import { NextRequest, NextResponse } from "next/server";
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
  createEmptyConversationRecord,
  loadConversationRecord,
  loadUserMemoryProfile,
} from "@/lib/conversation-store";

export async function GET(request: NextRequest) {
  const authSession = await getAuthSession(request.cookies);
  const url = new URL(request.url);
  const shouldReset = url.searchParams.get("reset") === "1";
  const guestId = getGuestIdFromCookies(request.cookies) ?? crypto.randomUUID();
  const conversationId = shouldReset
    ? crypto.randomUUID()
    : getConversationIdFromCookies(request.cookies) || crypto.randomUUID();
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

  const currentRecord =
    record ??
    createEmptyConversationRecord({
      conversationId,
      ownerKey,
    });
  const userMemory = await loadUserMemoryProfile(ownerKey);
  const response = NextResponse.json({
    conversationId,
    messages: currentRecord.messages,
    conversationSummary: currentRecord.summary,
    userMemory,
    user: authSession.user,
  });

  applySessionCookies(response, authSession.session);
  setConversationCookie(response, conversationId);
  setGuestCookie(response, guestId);

  return response;
}
