"use server";

import { redirect } from "next/navigation";
import { getSession, createMagicLink, getPlayerByEmail } from "@/app/lib/auth";
import { getClubByInviteCode, isClubMember, joinClub } from "@/app/lib/db/club";
import { sendMagicLinkEmail } from "@/app/lib/email";
import { sql } from "@/app/lib/db";

export type JoinStep =
  | "code-input"
  | "confirm-join"
  | "already-member"
  | "guest-email"
  | "check-email";

export type JoinState = {
  step: JoinStep;
  clubName?: string;
  inviteCode?: string;
  error?: string;
};

export async function validateCode(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const code = (formData.get("code") as string)?.trim().toUpperCase();

  if (!code || code.length !== 6) {
    return { step: "code-input", error: "Ungültiger Einladungscode" };
  }

  try {
    const club = await getClubByInviteCode(sql, code);

    if (!club) {
      return { step: "code-input", error: "Ungültiger Einladungscode" };
    }

    if (club.isDisabled) {
      return {
        step: "code-input",
        error: "Dieser Verein nimmt derzeit keine Mitglieder auf",
      };
    }

    const session = await getSession();

    if (session) {
      const isMember = await isClubMember(sql, session.playerId, club.id);

      if (isMember) {
        return {
          step: "already-member",
          clubName: club.name,
          inviteCode: code,
        };
      }

      return {
        step: "confirm-join",
        clubName: club.name,
        inviteCode: code,
      };
    }

    return {
      step: "guest-email",
      clubName: club.name,
      inviteCode: code,
    };
  } catch (error) {
    console.error("validateCode failed:", error);
    return {
      step: "code-input",
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }
}

export async function joinClubAction(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const inviteCode = (formData.get("inviteCode") as string)
    ?.trim()
    .toUpperCase();
  if (!inviteCode || !/^[A-Z0-9]{6}$/.test(inviteCode)) {
    return { step: "code-input", error: "Ungültiger Einladungscode" };
  }

  let club;
  try {
    club = await getClubByInviteCode(sql, inviteCode);
  } catch (error) {
    console.error("joinClubAction lookup failed:", error);
    return {
      step: "code-input",
      error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    };
  }

  if (!club || club.isDisabled) {
    return { step: "code-input", error: "Ungültiger Einladungscode" };
  }

  try {
    await joinClub(sql, session.playerId, club.id);
  } catch (error) {
    console.error("joinClubAction transaction failed:", error);
    return {
      step: "confirm-join",
      clubName: club.name,
      inviteCode,
      error: "Beitritt fehlgeschlagen. Bitte versuche es erneut.",
    };
  }

  // redirect() throws — must be outside try/catch
  redirect("/");
}

export async function requestJoinAction(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const inviteCode = (formData.get("inviteCode") as string)
    ?.trim()
    .toUpperCase();
  const clubName = formData.get("clubName") as string;

  if (!inviteCode || !/^[A-Z0-9]{6}$/.test(inviteCode)) {
    return { step: "code-input", error: "Ungültiger Einladungscode" };
  }

  if (!email || !email.includes("@")) {
    return {
      step: "guest-email",
      clubName,
      inviteCode,
      error: "Bitte gib eine gültige E-Mail-Adresse ein",
    };
  }

  // Enumeration protection: always return check-email regardless of whether player exists
  try {
    const player = await getPlayerByEmail(email);

    if (player) {
      const token = await createMagicLink(player.id);
      const returnTo = `/join?code=${inviteCode}`;
      const { success, error: emailError } = await sendMagicLinkEmail(
        email,
        player.name,
        token,
        returnTo,
      );
      if (!success) {
        console.error("Failed to send join magic link email:", emailError);
      }
    }
  } catch (error) {
    console.error("requestJoinAction failed:", error);
  }

  return { step: "check-email" };
}
