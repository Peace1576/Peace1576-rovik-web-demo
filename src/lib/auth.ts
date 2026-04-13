import { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";
import type { SessionUser } from "@/lib/demo-types";
import { createSupabaseServerClient, toSessionUser } from "@/lib/supabase";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

const ACCESS_TOKEN_COOKIE = "rovik-access-token";
const REFRESH_TOKEN_COOKIE = "rovik-refresh-token";
const GUEST_ID_COOKIE = "rovik-guest-id";
const CONVERSATION_ID_COOKIE = "rovik-conversation-id";
const cookieMaxAge = 60 * 60 * 24 * 30;

export type AuthSessionState = {
  session: Session | null;
  user: SessionUser | null;
};

function resolveNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/demo";
  }

  return nextPath;
}

export function getConversationIdFromCookies(cookieReader: CookieReader) {
  return cookieReader.get(CONVERSATION_ID_COOKIE)?.value?.trim() || null;
}

export function getGuestIdFromCookies(cookieReader: CookieReader) {
  return cookieReader.get(GUEST_ID_COOKIE)?.value?.trim() || null;
}

export function setGuestCookie(
  response: NextResponse,
  guestId: string,
) {
  response.cookies.set(GUEST_ID_COOKIE, guestId, {
    httpOnly: true,
    maxAge: cookieMaxAge,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export function ensureGuestId(
  cookieReader: CookieReader,
  response: NextResponse,
) {
  const existingGuestId = getGuestIdFromCookies(cookieReader);

  if (existingGuestId) {
    return existingGuestId;
  }

  const guestId = crypto.randomUUID();
  setGuestCookie(response, guestId);

  return guestId;
}

export function setConversationCookie(
  response: NextResponse,
  conversationId: string,
) {
  response.cookies.set(CONVERSATION_ID_COOKIE, conversationId, {
    httpOnly: true,
    maxAge: cookieMaxAge,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}

export function applySessionCookies(
  response: NextResponse,
  session: Session | null,
) {
  if (!session?.access_token || !session.refresh_token) {
    return;
  }

  const maxAge =
    session.expires_in && Number.isFinite(session.expires_in)
      ? session.expires_in
      : cookieMaxAge;

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    httpOnly: true,
    maxAge: cookieMaxAge,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export async function getAuthSession(
  cookieReader: CookieReader,
): Promise<AuthSessionState> {
  const accessToken = cookieReader.get(ACCESS_TOKEN_COOKIE)?.value?.trim();
  const refreshToken = cookieReader.get(REFRESH_TOKEN_COOKIE)?.value?.trim();

  if (!accessToken && !refreshToken) {
    return {
      session: null,
      user: null,
    };
  }

  const supabase = createSupabaseServerClient();

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!error) {
      const session = data.session ?? null;
      const sessionUser = toSessionUser(data.user ?? session?.user ?? null);

      return {
        session,
        user: sessionUser,
      };
    }
  }

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (!error) {
      return {
        session: null,
        user: toSessionUser(data.user ?? null),
      };
    }
  }

  return {
    session: null,
    user: null,
  };
}

export async function startGoogleSignIn({
  origin,
  nextPath,
}: {
  origin: string;
  nextPath?: string | null;
}) {
  const supabase = createSupabaseServerClient();
  const redirectTo = new URL("/auth/callback", origin);
  redirectTo.searchParams.set("next", resolveNextPath(nextPath));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    throw new Error(
      error?.message || "Google sign-in could not start right now.",
    );
  }

  return data.url;
}

export async function exchangeCodeForSession(code: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    throw new Error(
      error?.message || "Google sign-in could not complete right now.",
    );
  }

  return {
    session: data.session,
    user: toSessionUser(data.user ?? data.session.user ?? null),
  };
}

export async function signInWithEmailPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(
      error?.message || "Email sign-in could not complete right now.",
    );
  }

  return {
    session: data.session,
    user: toSessionUser(data.user ?? data.session.user ?? null),
  };
}

export async function signUpWithEmailPassword({
  email,
  password,
  origin,
}: {
  email: string;
  password: string;
  origin: string;
}) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/demo", origin).toString(),
    },
  });

  if (error) {
    throw new Error(error.message || "Account creation could not complete.");
  }

  return {
    session: data.session ?? null,
    user: toSessionUser(data.user ?? data.session?.user ?? null),
    needsEmailConfirmation: !data.session,
  };
}

export function buildOwnerKey(
  user: SessionUser | null,
  guestId: string,
) {
  return user?.id ? `users/${user.id}` : `guests/${guestId}`;
}
