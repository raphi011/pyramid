"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getSession, createMagicLink, getPlayerByEmail } from "@/app/lib/auth";
import { getClubByInviteCode, isClubMember, joinClub } from "@/app/lib/db/club";
import { sendMagicLinkEmail } from "@/app/lib/email";
import { sql } from "@/app/lib/db";
import { fullName } from "@/lib/utils";
import { parseFormData } from "@/app/lib/action-utils";

const codeSchema = z.object({
  code: z.string().trim().toUpperCase().length(6),
});

const inviteCodeSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
});

const requestJoinSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
  clubName: z.string().optional().default(""),
});

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
  const parsed = parseFormData(codeSchema, formData);
  if (!parsed.success) {
    return { step: "code-input", error: "Ungültiger Einladungscode" };
  }
  const { code } = parsed.data;

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

  const parsed = parseFormData(inviteCodeSchema, formData);
  if (!parsed.success) {
    return { step: "code-input", error: "Ungültiger Einladungscode" };
  }
  const { inviteCode } = parsed.data;

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
  const parsed = parseFormData(requestJoinSchema, formData);
  if (!parsed.success) {
    // Preserve form state for the user
    const rawInviteCode = (formData.get("inviteCode") as string)
      ?.trim()
      .toUpperCase();
    const rawClubName = formData.get("clubName") as string;

    if (!rawInviteCode || !/^[A-Z0-9]{6}$/.test(rawInviteCode)) {
      return { step: "code-input", error: "Ungültiger Einladungscode" };
    }
    return {
      step: "guest-email",
      clubName: rawClubName,
      inviteCode: rawInviteCode,
      error: "Bitte gib eine gültige E-Mail-Adresse ein",
    };
  }
  const { email, inviteCode, clubName } = parsed.data;

  // Enumeration protection: always return check-email regardless of whether player exists
  try {
    const player = await getPlayerByEmail(email);

    if (player) {
      const token = await createMagicLink(player.id);
      const returnTo = `/join?code=${inviteCode}`;
      const { success, error: emailError } = await sendMagicLinkEmail(
        email,
        fullName(player.firstName, player.lastName),
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
