import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink, createSession, setSessionCookie } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  try {
    const result = await verifyMagicLink(token);

    if (!result) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    // Create session and set cookie
    const sessionToken = await createSession(result.playerId);
    await setSessionCookie(sessionToken);

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.redirect(new URL("/login?error=server_error", request.url));
  }
}
