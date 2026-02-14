import type postgres from "postgres";
// Ensures TransactionSql module augmentation is in compilation scope (see app/lib/db.ts)
import type { Sql as _Sql } from "../db";

type Tx = postgres.TransactionSql;

// ── Player ────────────────────────────────────────────

export async function seedPlayer(
  tx: Tx,
  email: string,
  name = "Test Player",
): Promise<number> {
  const [row] = await tx`
    INSERT INTO player (name, email_address, created)
    VALUES (${name}, ${email}, NOW())
    RETURNING id
  `;
  return row.id as number;
}

// ── Club ──────────────────────────────────────────────

export async function seedClub(
  tx: Tx,
  {
    name = "Test Club",
    inviteCode = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    isDisabled = false,
  } = {},
): Promise<number> {
  const [row] = await tx`
    INSERT INTO clubs (name, invite_code, is_disabled, created)
    VALUES (${name}, ${inviteCode}, ${isDisabled}, NOW())
    RETURNING id
  `;
  return row.id as number;
}

// ── Club Member ───────────────────────────────────────

export async function seedClubMember(
  tx: Tx,
  playerId: number,
  clubId: number,
  role = "player",
): Promise<void> {
  await tx`
    INSERT INTO club_members (player_id, club_id, role, created)
    VALUES (${playerId}, ${clubId}, ${role}, NOW())
  `;
}

// ── Season ────────────────────────────────────────────

export async function seedSeason(
  tx: Tx,
  clubId: number,
  {
    name = "Test Season",
    status = "active",
    minTeamSize = 1,
    maxTeamSize = 1,
  } = {},
): Promise<number> {
  const [row] = await tx`
    INSERT INTO seasons (club_id, name, status, min_team_size, max_team_size, created)
    VALUES (${clubId}, ${name}, ${status}, ${minTeamSize}, ${maxTeamSize}, NOW())
    RETURNING id
  `;
  return row.id as number;
}

// ── Team ──────────────────────────────────────────────

export async function seedTeam(
  tx: Tx,
  seasonId: number,
  playerIds: number[],
  { name = "", optedOut = false } = {},
): Promise<number> {
  const [row] = await tx`
    INSERT INTO teams (season_id, name, opted_out, created)
    VALUES (${seasonId}, ${name}, ${optedOut}, NOW())
    RETURNING id
  `;
  const teamId = row.id as number;

  for (const playerId of playerIds) {
    await tx`
      INSERT INTO team_players (team_id, player_id, created)
      VALUES (${teamId}, ${playerId}, NOW())
    `;
  }

  return teamId;
}

// ── Match ─────────────────────────────────────

export async function seedMatch(
  tx: Tx,
  seasonId: number,
  team1Id: number,
  team2Id: number,
  {
    status = "completed",
    winnerTeamId,
    resultEnteredBy,
    team1Score,
    team2Score,
    gameAt,
  }: {
    status?: string;
    winnerTeamId?: number;
    resultEnteredBy?: number;
    team1Score?: number[];
    team2Score?: number[];
    gameAt?: Date;
  } = {},
): Promise<number> {
  const [row] = await tx`
    INSERT INTO season_matches (season_id, team1_id, team2_id, winner_team_id, result_entered_by, team1_score, team2_score, game_at, status, created)
    VALUES (${seasonId}, ${team1Id}, ${team2Id}, ${winnerTeamId ?? null}, ${resultEnteredBy ?? null}, ${team1Score ?? null}, ${team2Score ?? null}, ${gameAt ?? null}, ${status}, NOW())
    RETURNING id
  `;
  return row.id as number;
}

// ── Date Proposal ────────────────────────────────────

export async function seedDateProposal(
  tx: Tx,
  matchId: number,
  proposedBy: number,
  {
    proposedDatetime = new Date("2026-03-01T10:00:00Z"),
    status = "pending",
  }: { proposedDatetime?: Date; status?: string } = {},
): Promise<number> {
  const [row] = await tx`
    INSERT INTO date_proposals (match_id, proposed_by, proposed_datetime, status, created)
    VALUES (${matchId}, ${proposedBy}, ${proposedDatetime}, ${status}, NOW())
    RETURNING id
  `;
  return row.id as number;
}

// ── Standings ─────────────────────────────────────────

export async function seedStandings(
  tx: Tx,
  seasonId: number,
  teamIds: number[],
): Promise<number> {
  const [row] = await tx`
    INSERT INTO season_standings (season_id, results, created)
    VALUES (${seasonId}, ${teamIds}, NOW())
    RETURNING id
  `;
  return row.id as number;
}

// ── Event Read ──────────────────────────────────────

export async function seedEventRead(
  tx: Tx,
  playerId: number,
  clubId: number,
  lastReadAt: Date = new Date(),
): Promise<void> {
  await tx`
    INSERT INTO event_reads (player_id, club_id, last_read_at)
    VALUES (${playerId}, ${clubId}, ${lastReadAt})
    ON CONFLICT (player_id, club_id)
    DO UPDATE SET last_read_at = ${lastReadAt}
  `;
}

// ── Event ────────────────────────────────────────────

export async function seedEvent(
  tx: Tx,
  clubId: number,
  {
    seasonId,
    matchId,
    playerId,
    targetPlayerId,
    eventType = "challenge",
    metadata = {},
    created,
  }: {
    seasonId?: number;
    matchId?: number;
    playerId?: number;
    targetPlayerId?: number;
    eventType?: string;
    metadata?: Record<string, postgres.JSONValue>;
    created?: Date;
  } = {},
): Promise<number> {
  const [row] = created
    ? await tx`
        INSERT INTO events (club_id, season_id, match_id, player_id, target_player_id, event_type, metadata, created)
        VALUES (${clubId}, ${seasonId ?? null}, ${matchId ?? null}, ${playerId ?? null}, ${targetPlayerId ?? null}, ${eventType}, ${tx.json(metadata)}, ${created})
        RETURNING id
      `
    : await tx`
        INSERT INTO events (club_id, season_id, match_id, player_id, target_player_id, event_type, metadata, created)
        VALUES (${clubId}, ${seasonId ?? null}, ${matchId ?? null}, ${playerId ?? null}, ${targetPlayerId ?? null}, ${eventType}, ${tx.json(metadata)}, NOW())
        RETURNING id
      `;
  return row.id as number;
}
