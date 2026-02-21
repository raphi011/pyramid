import { NextRequest, NextResponse } from "next/server";
import {
  verifyMagicLink,
  createSession,
  setSessionCookie,
  setThemeCookie,
  setLocaleCookie,
} from "@/app/lib/auth";
import {
  getPlayerById,
  getPlayerTheme,
  getPlayerLanguage,
} from "@/app/lib/db/auth";
import { getPlayerClubs } from "@/app/lib/db/club";
import { sql } from "@/app/lib/db";
import { getAppUrl } from "@/app/lib/email";

function isValidReturnTo(returnTo: string): boolean {
  return (
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.includes(":")
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const returnTo = request.nextUrl.searchParams.get("returnTo");
  const baseUrl = getAppUrl();

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing_token", baseUrl),
    );
  }

  try {
    const result = await verifyMagicLink(token);

    if (!result) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_token", baseUrl),
      );
    }

    // Create session and set cookies
    const sessionToken = await createSession(result.playerId);
    await setSessionCookie(sessionToken);

    // Post-login routing — failures here should not invalidate the login
    try {
      // Sync theme + locale preferences to cookies
      const theme = await getPlayerTheme(sql, result.playerId);
      await setThemeCookie(theme);
      const language = await getPlayerLanguage(sql, result.playerId);
      await setLocaleCookie(language);

      // 1. No name → onboarding (both first and last name required)
      const player = await getPlayerById(sql, result.playerId);
      if (!player || !player.firstName.trim() || !player.lastName.trim()) {
        return NextResponse.redirect(new URL("/onboarding", baseUrl));
      }

      // 2. Valid returnTo → go there
      if (returnTo && isValidReturnTo(returnTo)) {
        return NextResponse.redirect(new URL(returnTo, baseUrl));
      }

      // 3. 0 clubs → join page
      const clubs = await getPlayerClubs(sql, result.playerId);
      if (clubs.length === 0) {
        return NextResponse.redirect(new URL("/join", baseUrl));
      }
    } catch (routingError) {
      console.error("Post-login routing failed:", routingError);
    }

    // 4. Default → home
    return NextResponse.redirect(new URL("/", baseUrl));
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.redirect(new URL("/login?error=server_error", baseUrl));
  }
}
