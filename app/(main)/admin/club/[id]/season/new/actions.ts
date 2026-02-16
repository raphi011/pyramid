"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { getPlayerRole } from "@/app/lib/db/club";
import { parseFormData } from "@/app/lib/action-utils";

// ── Result type ─────────────────────────────────────────

export type CreateSeasonResult =
  | { success: true; seasonId: number }
  | { error: string };

// ── Schema ──────────────────────────────────────────────

const createSeasonSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  type: z.enum(["individual", "team"]),
  teamSize: z.coerce.number().int().min(1).max(4).default(1),
  bestOf: z.coerce.number().int(),
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
    .transform((v) => (v === "" ? [] : v.split(",").map(Number))),
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

  // Auth check
  const player = await getCurrentPlayer();
  if (!player) {
    return { error: "createSeason.error.unauthorized" };
  }

  const role = await getPlayerRole(sql, player.id, clubId);
  if (role !== "admin") {
    return { error: "createSeason.error.unauthorized" };
  }

  const excludedSet = new Set(excludedMembers);

  const minTeamSize = type === "team" ? teamSize : 1;
  const maxTeamSize = type === "team" ? teamSize : 1;

  let seasonId: number;

  try {
    seasonId = await sql.begin(async (tx) => {
      // 1. Insert season
      const seasonRows = await tx`
        INSERT INTO seasons (
          club_id, name, min_team_size, max_team_size, best_of,
          match_deadline_days, reminder_after_days,
          requires_result_confirmation, open_enrollment,
          status, created
        )
        VALUES (
          ${clubId}, ${name}, ${minTeamSize}, ${maxTeamSize}, ${bestOf},
          ${matchDeadlineDays}, ${reminderDays},
          ${requiresConfirmation}, ${openEnrollment},
          'draft', NOW()
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
          // Insert standings with team IDs in order
          await tx`
            INSERT INTO season_standings (season_id, match_id, results, comment, created)
            VALUES (${newSeasonId}, NULL, ${teamIds}, '', NOW())
          `;
        } else if (startingRanks === "from_season" && fromSeasonId != null) {
          // Copy standings order from previous season
          const prevStandings = await tx`
            SELECT results
            FROM season_standings
            WHERE season_id = ${fromSeasonId}
            ORDER BY id DESC
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
  } catch {
    return { error: "createSeason.error.serverError" };
  }

  redirect(`/admin/club/${clubId}/season/${seasonId}`);
}
