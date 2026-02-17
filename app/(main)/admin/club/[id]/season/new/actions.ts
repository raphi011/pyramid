"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { sql } from "@/app/lib/db";
import { requireClubAdmin } from "@/app/lib/require-admin";
import { parseFormData } from "@/app/lib/action-utils";
import { generateInviteCode } from "@/app/lib/auth";
import type { ActionResultWith } from "@/app/lib/action-result";

type CreateSeasonResult = ActionResultWith<{ seasonId: number }>;

// ── Schema ──────────────────────────────────────────────

const VALID_BEST_OF = [1, 3, 5, 7] as const;

const createSeasonSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  type: z.enum(["individual", "team"]),
  teamSize: z.coerce.number().int().min(1).max(4).default(1),
  bestOf: z.coerce
    .number()
    .int()
    .refine((v) => VALID_BEST_OF.includes(v as 1)),
  matchDeadlineDays: z.coerce.number().int().min(1).max(90),
  reminderDays: z.coerce.number().int().min(1).max(90),
  requiresConfirmation: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  openEnrollment: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  startingRanks: z.enum(["empty", "from_season"]),
  fromSeasonId: z.coerce.number().int().positive().optional(),
  excludedMembers: z
    .string()
    .default("")
    .transform((v) =>
      v === ""
        ? []
        : v
            .split(",")
            .map(Number)
            .filter((n) => !Number.isNaN(n)),
    ),
});

// ── Action ──────────────────────────────────────────────

export async function createSeasonAction(
  formData: FormData,
): Promise<CreateSeasonResult> {
  const parsed = parseFormData(createSeasonSchema, formData);
  if (!parsed.success) {
    return { error: "createSeason.error.invalidInput" };
  }

  const {
    clubId,
    name,
    type,
    teamSize,
    bestOf,
    matchDeadlineDays,
    reminderDays,
    requiresConfirmation,
    openEnrollment,
    startingRanks,
    fromSeasonId,
    excludedMembers,
  } = parsed.data;

  // Require fromSeasonId when copying from previous season
  if (startingRanks === "from_season" && fromSeasonId == null) {
    return { error: "createSeason.error.missingSourceSeason" };
  }

  const authCheck = await requireClubAdmin(
    clubId,
    "createSeason.error.unauthorized",
  );
  if (authCheck.error) return { error: authCheck.error };

  const excludedSet = new Set(excludedMembers);

  const minTeamSize = type === "team" ? teamSize : 1;
  const maxTeamSize = type === "team" ? teamSize : 1;

  let seasonId: number;

  try {
    seasonId = await sql.begin(async (tx) => {
      // Verify fromSeasonId belongs to this club (IDOR prevention)
      if (startingRanks === "from_season" && fromSeasonId != null) {
        const sourceCheck = await tx`
          SELECT 1 FROM seasons WHERE id = ${fromSeasonId} AND club_id = ${clubId}
        `;
        if (sourceCheck.length === 0) {
          throw new Error("INVALID_SOURCE_SEASON");
        }
      }

      // 1. Insert season
      const seasonRows = await tx`
        INSERT INTO seasons (
          club_id, name, min_team_size, max_team_size, best_of,
          match_deadline_days, reminder_after_days,
          requires_result_confirmation, open_enrollment,
          invite_code, status, created
        )
        VALUES (
          ${clubId}, ${name}, ${minTeamSize}, ${maxTeamSize}, ${bestOf},
          ${matchDeadlineDays}, ${reminderDays},
          ${requiresConfirmation}, ${openEnrollment},
          ${generateInviteCode()}, 'draft', NOW()
        )
        RETURNING id
      `;
      const newSeasonId = (seasonRows[0] as { id: number }).id;

      // 2. For individual seasons: create a team per included club member
      if (type === "individual") {
        const memberRows = await tx<{ id: number; name: string }[]>`
          SELECT p.id, CONCAT(p.first_name, ' ', p.last_name) AS name
          FROM club_members cm
          JOIN player p ON p.id = cm.player_id
          WHERE cm.club_id = ${clubId}
          ORDER BY p.first_name ASC
        `;

        const includedMembers = memberRows.filter(
          (m) => !excludedSet.has(m.id),
        );

        // Create teams + team_players for each included member
        const teamIds: number[] = [];
        for (const member of includedMembers) {
          const teamRows = await tx`
            INSERT INTO teams (season_id, name, opted_out, created)
            VALUES (${newSeasonId}, ${member.name}, false, NOW())
            RETURNING id
          `;
          const teamId = (teamRows[0] as { id: number }).id;
          teamIds.push(teamId);

          await tx`
            INSERT INTO team_players (team_id, player_id, created)
            VALUES (${teamId}, ${member.id}, NOW())
          `;
        }

        // 3. Create initial standings
        if (startingRanks === "empty" && teamIds.length > 0) {
          await tx`
            INSERT INTO season_standings (season_id, match_id, results, comment, created)
            VALUES (${newSeasonId}, NULL, ${teamIds}, '', NOW())
          `;
        } else if (startingRanks === "from_season" && fromSeasonId != null) {
          const prevStandings = await tx`
            SELECT ss.results
            FROM season_standings ss
            JOIN seasons s ON s.id = ss.season_id
            WHERE ss.season_id = ${fromSeasonId} AND s.club_id = ${clubId}
            ORDER BY ss.id DESC
            LIMIT 1
          `;

          if (prevStandings.length > 0) {
            const oldTeamIds = (prevStandings[0] as { results: number[] })
              .results;

            // Map old teamId -> playerId
            const oldTeamPlayerRows = await tx<
              { team_id: number; player_id: number }[]
            >`
              SELECT tp.team_id, tp.player_id
              FROM team_players tp
              JOIN teams t ON t.id = tp.team_id
              WHERE t.season_id = ${fromSeasonId}
            `;
            const oldTeamToPlayer = new Map<number, number>();
            for (const row of oldTeamPlayerRows) {
              oldTeamToPlayer.set(row.team_id, row.player_id);
            }

            // Map playerId -> new teamId
            const newTeamPlayerRows = await tx<
              { team_id: number; player_id: number }[]
            >`
              SELECT tp.team_id, tp.player_id
              FROM team_players tp
              JOIN teams t ON t.id = tp.team_id
              WHERE t.season_id = ${newSeasonId}
            `;
            const playerToNewTeam = new Map<number, number>();
            for (const row of newTeamPlayerRows) {
              playerToNewTeam.set(row.player_id, row.team_id);
            }

            // Build new results array preserving order from previous season
            const newResults: number[] = [];
            for (const oldTeamId of oldTeamIds) {
              const playerId = oldTeamToPlayer.get(oldTeamId);
              if (playerId != null) {
                const newTeamId = playerToNewTeam.get(playerId);
                if (newTeamId != null) {
                  newResults.push(newTeamId);
                }
              }
            }

            // Add any new players not in previous season at the end
            for (const tId of teamIds) {
              if (!newResults.includes(tId)) {
                newResults.push(tId);
              }
            }

            if (newResults.length > 0) {
              await tx`
                INSERT INTO season_standings (season_id, match_id, results, comment, created)
                VALUES (${newSeasonId}, NULL, ${newResults}, '', NOW())
              `;
            }
          } else {
            // No previous standings found, fall back to empty order
            if (teamIds.length > 0) {
              await tx`
                INSERT INTO season_standings (season_id, match_id, results, comment, created)
                VALUES (${newSeasonId}, NULL, ${teamIds}, '', NOW())
              `;
            }
          }
        }
      }

      return newSeasonId;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_SOURCE_SEASON") {
      return { error: "createSeason.error.invalidSourceSeason" };
    }
    console.error("[createSeasonAction] Failed:", { clubId, error });
    return { error: "createSeason.error.serverError" };
  }

  // IMPORTANT: redirect() throws — must stay OUTSIDE the try-catch above
  redirect(`/admin/club/${clubId}/season/${seasonId}`);
}
