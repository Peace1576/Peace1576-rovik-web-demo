import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { SessionUser } from "@/lib/demo-types";

function readEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

function decodeJwtPayload(token: string) {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      ref?: string;
    };
  } catch {
    return null;
  }
}

function inferSupabaseUrlFromServiceRoleKey() {
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    return undefined;
  }

  const payload = decodeJwtPayload(serviceRoleKey);
  const ref = payload?.ref?.trim();

  return ref ? `https://${ref}.supabase.co` : undefined;
}

export function getSupabaseUrl() {
  const url =
    readEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL") ||
    inferSupabaseUrlFromServiceRoleKey();

  if (!url) {
    throw new Error(
      "Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.",
    );
  }

  return url;
}

export function getSupabaseServerKey() {
  const key = readEnv("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");

  if (!key) {
    throw new Error(
      "Missing Supabase server key. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return key;
}

export function isSupabaseConfigured() {
  try {
    getSupabaseUrl();
    getSupabaseServerKey();
    return true;
  } catch {
    return false;
  }
}

export function createSupabaseServerClient() {
  return createClient(getSupabaseUrl(), getSupabaseServerKey(), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      flowType: "pkce",
    },
  });
}

export function toSessionUser(user: User | null): SessionUser | null {
  if (!user) {
    return null;
  }

  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      metadata.full_name ??
      metadata.name ??
      metadata.user_name ??
      user.email ??
      null,
    avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
    isAuthenticated: true,
  };
}
