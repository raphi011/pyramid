import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

function getAppUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

export async function sendMagicLinkEmail(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const magicLinkUrl = `${getAppUrl()}/api/auth/verify?token=${token}`;

  try {
    const { error } = await getResend().emails.send({
      from: "Pyramid <noreply@pyramid.tennis>",
      to: email,
      subject: "Dein Login-Link für Pyramid",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a; margin-bottom: 24px;">Hallo ${name},</h2>

          <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
            Klicke auf den Button unten, um dich bei Pyramid anzumelden.
          </p>

          <a href="${magicLinkUrl}"
             style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Anmelden
          </a>

          <p style="color: #888; font-size: 14px; margin-top: 32px; line-height: 1.5;">
            Dieser Link ist 15 Minuten gültig.<br>
            Falls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">

          <p style="color: #888; font-size: 12px;">
            Falls der Button nicht funktioniert, kopiere diesen Link:<br>
            <a href="${magicLinkUrl}" style="color: #0ea5e9; word-break: break-all;">${magicLinkUrl}</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send magic link email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error sending magic link email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
