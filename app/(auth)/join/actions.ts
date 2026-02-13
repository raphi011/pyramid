"use server";

import { redirect } from "next/navigation";
import { getSession, createMagicLink, getPlayerByEmail } from "@/app/lib/auth";
import { getClubByInviteCode, isClubMember, joinClub } from "@/app/lib/db/club";
import { autoEnrollInActiveSeasons, createNewPlayerEvent } from "@/app/lib/db/season";
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
  clubId?: number;
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
        clubId: club.id,
        clubName: club.name,
        inviteCode: code,
      };
    }

    return {
      step: "confirm-join",
      clubId: club.id,
      clubName: club.name,
      inviteCode: code,
    };
  }

  return {
    step: "guest-email",
    clubId: club.id,
    clubName: club.name,
    inviteCode: code,
  };
}

export async function joinClubAction(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const clubId = Number(formData.get("clubId"));
  if (!clubId) {
    return { step: "code-input", error: "Ungültiger Einladungscode" };
  }

  await sql.begin(async (tx) => {
    await joinClub(tx, session.playerId, clubId);
    await autoEnrollInActiveSeasons(tx, session.playerId, clubId);
    await createNewPlayerEvent(tx, clubId, session.playerId, {});
  });

  redirect("/");
}

export async function requestJoinAction(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const inviteCode = formData.get("inviteCode") as string;

  if (!email || !email.includes("@")) {
    return {
      step: "guest-email",
      clubId: _prev.clubId,
      clubName: _prev.clubName,
      inviteCode,
      error: "Bitte gib eine gültige E-Mail-Adresse ein",
    };
  }

  // Enumeration protection: always return check-email regardless of whether player exists
  const player = await getPlayerByEmail(email);

  if (player) {
    const token = await createMagicLink(player.id);
    const returnTo = `/join?code=${inviteCode}`;
    await sendMagicLinkEmail(email, player.name, token, returnTo);
  }

  return { step: "check-email" };
}
