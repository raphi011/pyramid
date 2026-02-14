import { NextRequest, NextResponse } from "next/server";
import { getPlayerByEmail, createMagicLink } from "@/app/lib/auth";
import { sendMagicLinkEmail } from "@/app/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-Mail-Adresse erforderlich" },
        { status: 400 },
      );
    }

    // Find player by email
    const player = await getPlayerByEmail(email);

    // Always return success to prevent email enumeration
    // But only send email if player exists
    if (player) {
      const token = await createMagicLink(player.id);
      const emailResult = await sendMagicLinkEmail(
        player.email,
        player.name,
        token,
      );

      if (!emailResult.success) {
        // Log the failure but don't expose to user (enumeration protection)
        console.error("Failed to send magic link email:", {
          playerId: player.id,
          error: emailResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Falls ein Konto mit dieser E-Mail existiert, wurde ein Login-Link gesendet.",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 },
    );
  }
}
