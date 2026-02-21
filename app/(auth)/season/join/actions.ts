"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import {
  getSession,
  getCurrentPlayer,
  createMagicLink,
  getPlayerByEmail,
} from "@/app/lib/auth";
import {
  getSeasonByInviteCode,
  isPlayerEnrolledInSeason,
  isIndividualSeason,
  enrollPlayerInIndividualSeason,
  addTeamToStandings,
  createNewPlayerEvent,
} from "@/app/lib/db/season";
import { joinClub } from "@/app/lib/db/club";
import { getOrCreatePlayer } from "@/app/lib/db/player";
import { sendMagicLinkEmail } from "@/app/lib/email";
import { sql } from "@/app/lib/db";
import { fullName } from "@/lib/utils";
import { parseFormData } from "@/app/lib/action-utils";

// ── Types ──────────────────────────────────────────────

export type SeasonJoinStep =
  | "loading"
  | "season-info"
  | "guest-form"
  | "check-email"
  | "already-enrolled"
  | "error";

export type SeasonJoinState = {
  step: SeasonJoinStep;
  seasonName?: string;
  clubName?: string;
  inviteCode?: string;
  error?: string;
};

// ── Schemas ──────────────────────────────────────────────

const inviteCodeField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/);

const codeSchema = z.object({ code: inviteCodeField });

const joinSeasonSchema = z.object({ inviteCode: inviteCodeField });

const guestJoinSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  inviteCode: inviteCodeField,
});

// ── Actions ──────────────────────────────────────────────

class AlreadyEnrolledError extends Error {}

/** Validate invite code and determine which step to show */
export async function validateSeasonCode(
  _prev: SeasonJoinState,
  formData: FormData,
): Promise<SeasonJoinState> {
  const parsed = parseFormData(codeSchema, formData);
  if (!parsed.success) {
    return { step: "error", error: "invalidCode" };
  }
  const { code } = parsed.data;

  try {
    const season = await getSeasonByInviteCode(sql, code);

    if (!season) {
      return { step: "error", error: "codeNotFound" };
    }

    if (season.status !== "active") {
      return { step: "error", error: "seasonNotActive" };
    }

    if (!season.openEnrollment) {
      return { step: "error", error: "enrollmentClosed" };
    }

    // Invite link join supports individual seasons only; team seasons require manual roster assignment
    if (!isIndividualSeason(season)) {
      return { step: "error", error: "error.teamSeason" };
    }

    const session = await getSession();

    if (session) {
      if (await isPlayerEnrolledInSeason(sql, session.playerId, season.id)) {
        return {
          step: "already-enrolled",
          seasonName: season.name,
          clubName: season.clubName,
          inviteCode: code,
        };
      }

      return {
        step: "season-info",
        seasonName: season.name,
        clubName: season.clubName,
        inviteCode: code,
      };
    }

    return {
      step: "guest-form",
      seasonName: season.name,
      clubName: season.clubName,
      inviteCode: code,
    };
  } catch (error) {
    console.error("validateSeasonCode failed:", error);
    return { step: "error", error: "error.serverError" };
  }
}

/** Authenticated user joins the season (and club if needed) */
export async function joinSeasonAction(
  _prev: SeasonJoinState,
  formData: FormData,
): Promise<SeasonJoinState> {
  const parsed = parseFormData(joinSeasonSchema, formData);
  if (!parsed.success) {
    return { step: "error", error: "invalidCode" };
  }
  const { inviteCode } = parsed.data;

  // redirect() throws — must stay OUTSIDE the try-catch below
  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  let season;
  try {
    season = await getSeasonByInviteCode(sql, inviteCode);
    if (!season || season.status !== "active" || !season.openEnrollment) {
      return { step: "error", error: "seasonNotActive" };
    }

    // Invite link join supports individual seasons only
    if (!isIndividualSeason(season)) {
      return { step: "error", error: "error.teamSeason" };
    }

    if (await isPlayerEnrolledInSeason(sql, player.id, season.id)) {
      return {
        step: "already-enrolled",
        seasonName: season.name,
        clubName: season.clubName,
        inviteCode,
      };
    }
  } catch (e) {
    console.error("joinSeasonAction pre-transaction failed:", {
      inviteCode,
      playerId: player.id,
      error: e,
    });
    return { step: "error", error: "error.serverError" };
  }

  try {
    await sql.begin(async (tx) => {
      // Ensure player is a club member (ON CONFLICT DO NOTHING if already joined)
      await joinClub(tx, player.id, season.clubId);

      // Re-check enrollment inside transaction to prevent TOCTOU race
      if (await isPlayerEnrolledInSeason(tx, player.id, season.id)) {
        throw new AlreadyEnrolledError();
      }

      const teamId = await enrollPlayerInIndividualSeason(
        tx,
        player.id,
        season.id,
      );
      const startingRank = await addTeamToStandings(tx, season.id, teamId);
      await createNewPlayerEvent(
        tx,
        season.clubId,
        player.id,
        {
          firstName: player.firstName,
          lastName: player.lastName,
          startingRank,
        },
        season.id,
      );
    });
  } catch (e) {
    if (e instanceof AlreadyEnrolledError) {
      return {
        step: "already-enrolled",
        seasonName: season.name,
        clubName: season.clubName,
        inviteCode,
      };
    }
    console.error("joinSeasonAction failed:", {
      inviteCode,
      playerId: player.id,
      error: e,
    });
    return {
      step: "season-info",
      seasonName: season.name,
      clubName: season.clubName,
      inviteCode,
      error: "error.serverError",
    };
  }

  // redirect() throws — must be outside try/catch
  redirect("/feed");
}

/** Unauthenticated user: find or create player (upsert), then send magic link */
export async function requestSeasonJoinAction(
  _prev: SeasonJoinState,
  formData: FormData,
): Promise<SeasonJoinState> {
  const parsed = parseFormData(guestJoinSchema, formData);
  if (!parsed.success) {
    const stateFromForm: SeasonJoinState = {
      step: "guest-form",
      seasonName: (formData.get("seasonName") as string) ?? "",
      clubName: (formData.get("clubName") as string) ?? "",
      inviteCode:
        (formData.get("inviteCode") as string)?.trim().toUpperCase() ?? "",
    };
    return {
      ...stateFromForm,
      error: parsed.fieldErrors.email ? "error.invalidEmail" : "invalidInput",
    };
  }
  const { firstName, lastName, email, inviteCode } = parsed.data;

  // Validate invite code maps to a valid active season before creating a player
  const season = await getSeasonByInviteCode(sql, inviteCode);
  if (!season || season.status !== "active" || !season.openEnrollment) {
    return { step: "error", error: "seasonNotActive" };
  }

  // Step 1: Ensure player exists (not enumeration-sensitive — this is account creation)
  let player;
  try {
    player = await getPlayerByEmail(email);

    if (!player) {
      player = await getOrCreatePlayer(sql, { email, firstName, lastName });
    }
  } catch (error) {
    console.error("requestSeasonJoinAction: player creation failed:", error);
    return {
      step: "guest-form",
      seasonName: season.name,
      clubName: season.clubName,
      inviteCode,
      error: "error.serverError",
    };
  }

  // Step 2: Send magic link (enumeration-protected — always return check-email regardless
  // of whether the player existed or the email sends, so attackers cannot probe for
  // registered addresses)
  try {
    const token = await createMagicLink(player.id);
    const returnTo = `/season/join?code=${inviteCode}`;
    const { success, error: emailError } = await sendMagicLinkEmail(
      email,
      fullName(player.firstName, player.lastName),
      token,
      returnTo,
    );
    if (!success) {
      console.error("Failed to send season join magic link:", emailError);
    }
  } catch (error) {
    console.error("requestSeasonJoinAction: email send failed:", error);
  }

  return { step: "check-email" };
}
