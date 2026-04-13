import { NextRequest, NextResponse } from "next/server";
import { startGoogleSignIn } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const nextPath = url.searchParams.get("next");
    const redirectUrl = await startGoogleSignIn({
      origin: url.origin,
      nextPath,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const redirectUrl = new URL("/demo", request.url);
    redirectUrl.searchParams.set(
      "authError",
      error instanceof Error
        ? error.message
        : "Google sign-in could not start right now.",
    );

    return NextResponse.redirect(redirectUrl);
  }
}
