import type {
  ConversationMessage,
  ConversationRecord,
  ConversationSummary,
  DemoMode,
  RovikPersonality,
  UserMemoryProfile,
} from "@/lib/demo-types";
import { createSupabaseServerClient } from "@/lib/supabase";

const MEMORY_BUCKET = "rovik-memory";

declare global {
  var __rovikMemoryBucketReady: Promise<void> | undefined;
}

function getConversationPath(ownerKey: string, conversationId: string) {
  return `conversations/${ownerKey}/${conversationId}.json`;
}

function getUserMemoryPath(ownerKey: string) {
  return `profiles/${ownerKey}/memory.json`;
}

function isMissingObjectError(message: string) {
  return /not found|does not exist|no such file/i.test(message);
}

async function ensureMemoryBucket() {
  if (!globalThis.__rovikMemoryBucketReady) {
    globalThis.__rovikMemoryBucketReady = (async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        throw new Error(`Supabase bucket lookup failed: ${error.message}`);
      }

      if (data.some((bucket) => bucket.name === MEMORY_BUCKET)) {
        return;
      }

      const { error: createError } = await supabase.storage.createBucket(
        MEMORY_BUCKET,
        {
          public: false,
          allowedMimeTypes: ["application/json"],
          fileSizeLimit: "1MB",
        },
      );

      if (createError && !/already exists/i.test(createError.message)) {
        throw new Error(
          `Supabase bucket creation failed: ${createError.message}`,
        );
      }
    })();
  }

  await globalThis.__rovikMemoryBucketReady;
}

async function downloadJson<T>(path: string): Promise<T | null> {
  await ensureMemoryBucket();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(MEMORY_BUCKET)
    .download(path);

  if (error) {
    if (isMissingObjectError(error.message)) {
      return null;
    }

    throw new Error(`Supabase download failed: ${error.message}`);
  }

  const raw = await data.text();

  if (!raw.trim()) {
    return null;
  }

  return JSON.parse(raw) as T;
}

async function uploadJson(path: string, payload: unknown) {
  await ensureMemoryBucket();

  const supabase = createSupabaseServerClient();
  const file = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const { error } = await supabase.storage.from(MEMORY_BUCKET).upload(path, file, {
    contentType: "application/json",
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
}

export function createConversationMessage({
  role,
  content,
  mode,
  personality,
}: {
  role: "user" | "assistant";
  content: string;
  mode: DemoMode;
  personality?: RovikPersonality;
}): ConversationMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    mode,
    personality,
  };
}

export function createEmptyConversationRecord({
  conversationId,
  ownerKey,
}: {
  conversationId: string;
  ownerKey: string;
}): ConversationRecord {
  return {
    conversationId,
    ownerKey,
    title: "New conversation",
    messages: [],
    lastActiveAt: new Date().toISOString(),
  };
}

export function buildConversationTitle(messages: ConversationMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const source = firstUserMessage?.content?.trim() || "New conversation";

  return source.length > 72 ? `${source.slice(0, 69).trimEnd()}...` : source;
}

export async function loadConversationRecord({
  ownerKey,
  conversationId,
}: {
  ownerKey: string;
  conversationId: string;
}) {
  return downloadJson<ConversationRecord>(
    getConversationPath(ownerKey, conversationId),
  );
}

export async function saveConversationRecord(record: ConversationRecord) {
  const nextRecord: ConversationRecord = {
    ...record,
    title: buildConversationTitle(record.messages),
    lastActiveAt: new Date().toISOString(),
  };

  await uploadJson(
    getConversationPath(nextRecord.ownerKey, nextRecord.conversationId),
    nextRecord,
  );

  return nextRecord;
}

export async function loadUserMemoryProfile(ownerKey: string) {
  return downloadJson<UserMemoryProfile>(getUserMemoryPath(ownerKey));
}

export async function saveUserMemoryProfile({
  ownerKey,
  profile,
}: {
  ownerKey: string;
  profile: UserMemoryProfile;
}) {
  const nextProfile: UserMemoryProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  await uploadJson(getUserMemoryPath(ownerKey), nextProfile);

  return nextProfile;
}

export function attachConversationSummary(
  record: ConversationRecord,
  summary: ConversationSummary | undefined,
) {
  return {
    ...record,
    summary,
  };
}
