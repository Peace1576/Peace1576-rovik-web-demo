import { NextRequest, NextResponse } from "next/server";
import {
  applySessionCookies,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/lib/auth";
import type {
  PasswordAuthRequest,
  PasswordAuthResponse,
} from "@/lib/demo-types";

function readBody(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Partial<PasswordAuthRequest>;
  const mode = payload.mode;
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (
    (mode !== "sign-in" && mode !== "sign-up") ||
    !email ||
    !password
  ) {
    return null;
  }

  return {
    mode,
    email,
    password,
  };
}

export async function POST(request: NextRequest) {
  let body: ReturnType<typeof readBody>;

  try {
    body = readBody(await request.json());
  } catch {
    body = null;
  }

  if (!body) {
    return NextResponse.json<PasswordAuthResponse>(
      {
        ok: false,
        message: "Enter a valid email address and password.",
      },
      {
        status: 400,
      },
    );
  }

  if (body.password.length < 8) {
    return NextResponse.json<PasswordAuthResponse>(
      {
        ok: false,
        message: "Password must be at least 8 characters.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    if (body.mode === "sign-in") {
      const { session, user } = await signInWithEmailPassword(body);
      const response = NextResponse.json<PasswordAuthResponse>({
        ok: true,
        user,
      });
      applySessionCookies(response, session);
      return response;
    }

    const { session, user, needsEmailConfirmation } =
      await signUpWithEmailPassword({
        ...body,
        origin: request.nextUrl.origin,
      });
    const response = NextResponse.json<PasswordAuthResponse>({
      ok: true,
      user,
      needsEmailConfirmation,
      message: needsEmailConfirmation
        ? "Account created. Check your email to confirm it, then sign in."
        : "Account created. You are signed in now.",
    });

    applySessionCookies(response, session);
    return response;
  } catch (error) {
    return NextResponse.json<PasswordAuthResponse>(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Authentication could not complete right now.",
      },
      {
        status: 400,
      },
    );
  }
}
