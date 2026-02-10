import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "postfix-relay.postfix.svc.cluster.local",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      tls: { rejectUnauthorized: false },
    });
  }
  return _transporter;
}

export function getAppUrl(): string {
  const appUrl = process.env.APP_URL;
  if (!appUrl && process.env.NODE_ENV === "production") {
    throw new Error("APP_URL environment variable is required in production");
  }
  return appUrl || "http://localhost:3000";
}

export async function sendMagicLinkEmail(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const magicLinkUrl = `${getAppUrl()}/api/auth/verify?token=${token}`;

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || "Pyramid <pyramid@raphi011.dev>",
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

    return { success: true };
  } catch (err) {
    console.error("Error sending magic link email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
