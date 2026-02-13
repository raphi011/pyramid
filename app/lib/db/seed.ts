import type postgres from "postgres";

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
