import { NextRequest, NextResponse } from "next/server";
import { updateUserMemoryProfile } from "@/lib/ai";
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
  loadConversationRecord,
  loadUserMemoryProfile,
  saveConversationRecord,
  saveUserMemoryProfile,
} from "@/lib/conversation-store";

type FinalizeConversationBody = {
  conversationId?: string;
};

export async function POST(request: NextRequest) {
  const authSession = await getAuthSession(request.cookies);
  const body = (await request.json().catch(() => ({}))) as FinalizeConversationBody;
  const guestId = getGuestIdFromCookies(request.cookies) ?? crypto.randomUUID();
  const conversationId =
    body.conversationId?.trim() ||
    getConversationIdFromCookies(request.cookies) ||
    "";
  const ownerKey = buildOwnerKey(authSession.user, guestId);

  if (!conversationId) {
    const emptyResponse = NextResponse.json({ ok: true, finalized: false });
    applySessionCookies(emptyResponse, authSession.session);
    setGuestCookie(emptyResponse, guestId);
    return emptyResponse;
  }

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

  if (!record || record.messages.length === 0) {
    const response = NextResponse.json({ ok: true, finalized: false });
    applySessionCookies(response, authSession.session);
    setConversationCookie(response, conversationId);
    setGuestCookie(response, guestId);
    return response;
  }

  const existingProfile = await loadUserMemoryProfile(ownerKey);
  const nextProfile = await updateUserMemoryProfile({
    existingProfile,
    conversation: record.messages,
    conversationSummary: record.summary,
  });

  await saveUserMemoryProfile({
    ownerKey,
    profile: nextProfile,
  });

  const finalizedRecord = await saveConversationRecord({
    ...record,
    ownerKey,
    archivedAt: new Date().toISOString(),
  });

  const response = NextResponse.json({
    ok: true,
    finalized: true,
    conversationId,
    conversationSummary: finalizedRecord.summary,
    userMemory: nextProfile,
  });

  applySessionCookies(response, authSession.session);
  setConversationCookie(response, conversationId);
  setGuestCookie(response, guestId);

  return response;
}
