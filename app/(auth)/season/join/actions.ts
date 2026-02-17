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

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
});

const joinSeasonSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
});

const guestJoinSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  inviteCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/),
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
    return { step: "error", error: "seasonJoin.invalidCode" };
  }
  const { code } = parsed.data;

  try {
    const season = await getSeasonByInviteCode(sql, code);

    if (!season) {
      return { step: "error", error: "seasonJoin.codeNotFound" };
    }

    if (season.status !== "active") {
      return { step: "error", error: "seasonJoin.seasonNotActive" };
    }

    if (!season.openEnrollment) {
      return { step: "error", error: "seasonJoin.enrollmentClosed" };
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
    return { step: "error", error: "seasonJoin.invalidCode" };
  }
  const { inviteCode } = parsed.data;

  const player = await getCurrentPlayer();
  if (!player) {
    redirect("/login");
  }

  const season = await getSeasonByInviteCode(sql, inviteCode);
  if (!season || season.status !== "active" || !season.openEnrollment) {
    return { step: "error", error: "seasonJoin.seasonNotActive" };
  }

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

  try {
    await sql.begin(async (tx) => {
      // Join club if not a member (idempotent via ON CONFLICT)
      await joinClub(tx, player.id, season.clubId);

      // Re-check enrollment inside transaction
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
    console.error("joinSeasonAction failed:", e);
    return {
      step: "season-info",
      seasonName: season.name,
      clubName: season.clubName,
      inviteCode,
      error: "error.serverError",
    };
  }

  // redirect() throws — must be outside try/catch
  redirect("/rankings");
}

/** Unauthenticated user: create player if needed, send magic link */
export async function requestSeasonJoinAction(
  _prev: SeasonJoinState,
  formData: FormData,
): Promise<SeasonJoinState> {
  const parsed = parseFormData(guestJoinSchema, formData);
  if (!parsed.success) {
    if (parsed.fieldErrors.email) {
      return {
        step: "guest-form",
        seasonName: (formData.get("seasonName") as string) ?? "",
        clubName: (formData.get("clubName") as string) ?? "",
        inviteCode:
          (formData.get("inviteCode") as string)?.trim().toUpperCase() ?? "",
        error: "error.invalidEmail",
      };
    }
    return {
      step: "guest-form",
      seasonName: (formData.get("seasonName") as string) ?? "",
      clubName: (formData.get("clubName") as string) ?? "",
      inviteCode:
        (formData.get("inviteCode") as string)?.trim().toUpperCase() ?? "",
      error: "seasonJoin.invalidInput",
    };
  }
  const { firstName, lastName, email, inviteCode } = parsed.data;

  // Enumeration protection: always return check-email
  try {
    let player = await getPlayerByEmail(email);

    if (!player) {
      // Create new player
      const [row] = await sql`
        INSERT INTO player (first_name, last_name, email_address, created)
        VALUES (${firstName}, ${lastName}, ${email}, NOW())
        ON CONFLICT (email_address) DO UPDATE SET email_address = EXCLUDED.email_address
        RETURNING id, first_name AS "firstName", last_name AS "lastName", email_address AS email
      `;
      player = {
        id: row.id as number,
        firstName: row.firstName as string,
        lastName: row.lastName as string,
        email: row.email as string,
      };
    }

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
    console.error("requestSeasonJoinAction failed:", error);
  }

  return { step: "check-email" };
}
