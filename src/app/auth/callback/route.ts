import { NextRequest, NextResponse } from "next/server";
import { applySessionCookies, exchangeCodeForSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next");
  const code = url.searchParams.get("code");
  const redirectUrl = new URL(nextPath?.startsWith("/") ? nextPath : "/demo", request.url);

  if (!code) {
    redirectUrl.searchParams.set(
      "authError",
      "Google sign-in returned without an authorization code.",
    );
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const { session } = await exchangeCodeForSession(code);
    const response = NextResponse.redirect(redirectUrl);
    applySessionCookies(response, session);
    return response;
  } catch (error) {
    redirectUrl.searchParams.set(
      "authError",
      error instanceof Error
        ? error.message
        : "Google sign-in could not complete right now.",
    );
    return NextResponse.redirect(redirectUrl);
  }
}
