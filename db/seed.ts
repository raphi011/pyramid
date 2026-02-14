import crypto from "crypto";
import postgres from "postgres";
import type { Sql as _Sql } from "../app/lib/db";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

const sql = postgres(DATABASE_URL);

async function seed() {
  await sql.begin(async (tx) => {
    // ── Wipe existing data ───────────────────────────
    // Order respects foreign key constraints (children first)
    await tx`DELETE FROM magic_links`;
    await tx`DELETE FROM sessions`;
    await tx`DELETE FROM event_reads`;
    await tx`DELETE FROM events`;
    await tx`DELETE FROM match_comments`;
    await tx`DELETE FROM date_proposals`;
    await tx`DELETE FROM season_matches`;
    await tx`DELETE FROM season_standings`;
    await tx`DELETE FROM team_players`;
    await tx`DELETE FROM teams`;
    await tx`DELETE FROM seasons`;
    await tx`DELETE FROM club_members`;
    await tx`DELETE FROM notification_preferences`;
    await tx`DELETE FROM clubs`;
    await tx`UPDATE player SET image_id = NULL`; // break circular FK
    await tx`DELETE FROM images`;
    await tx`DELETE FROM player`;

    // ── Club ──────────────────────────────────────────
    const [club] = await tx`
      INSERT INTO clubs (name, invite_code, is_disabled, created)
      VALUES ('TC Beispiel', 'test-123', false, NOW())
      RETURNING id
    `;
    const clubId = club.id;

    // ── Players ───────────────────────────────────────
    const players = [
      { name: "Anna Müller", email: "anna@example.com" },
      { name: "Max Weber", email: "max@example.com" },
      { name: "Lisa Schmidt", email: "lisa@example.com" },
      { name: "Tom Fischer", email: "tom@example.com" },
      { name: "Julia Braun", email: "julia@example.com" },
      { name: "Felix Wagner", email: "felix@example.com" },
    ];

    const playerIds: number[] = [];
    for (const p of players) {
      const [row] = await tx`
        INSERT INTO player (name, email_address, created)
        VALUES (${p.name}, ${p.email}, NOW())
        RETURNING id
      `;
      playerIds.push(row.id);
    }

    // ── Club memberships ──────────────────────────────
    for (const playerId of playerIds) {
      await tx`
        INSERT INTO club_members (player_id, club_id, role, created)
        VALUES (${playerId}, ${clubId}, 'player', NOW())
      `;
    }
    // Make first player admin
    await tx`
      UPDATE club_members SET role = 'admin'
      WHERE player_id = ${playerIds[0]} AND club_id = ${clubId}
    `;

    // ── Season ────────────────────────────────────────
    const [season] = await tx`
      INSERT INTO seasons (club_id, name, status, min_team_size, max_team_size, created, started_at)
      VALUES (${clubId}, 'Einzel 2026', 'active', 1, 1, NOW(), NOW())
      RETURNING id
    `;
    const seasonId = season.id;

    // ── Teams (one per player for individual season) ──
    const teamIds: number[] = [];
    for (const playerId of playerIds) {
      const [team] = await tx`
        INSERT INTO teams (season_id, name, opted_out, created)
        VALUES (${seasonId}, '', false, NOW())
        RETURNING id
      `;
      await tx`
        INSERT INTO team_players (team_id, player_id, created)
        VALUES (${team.id}, ${playerId}, NOW())
      `;
      teamIds.push(team.id);
    }

    // ── Standings (previous + current for movement arrows) ──
    // Previous: Anna, Max, Lisa, Tom, Julia, Felix
    await tx`
      INSERT INTO season_standings (season_id, results, created)
      VALUES (${seasonId}, ${teamIds}, NOW() - interval '1 day')
    `;
    // Current: Max moved up, Anna moved down
    const currentOrder = [
      teamIds[1], // Max (was 2nd → now 1st) ↑
      teamIds[0], // Anna (was 1st → now 2nd) ↓
      teamIds[2], // Lisa (unchanged)
      teamIds[3], // Tom (unchanged)
      teamIds[4], // Julia (unchanged)
      teamIds[5], // Felix (unchanged)
    ];
    await tx`
      INSERT INTO season_standings (season_id, results, created)
      VALUES (${seasonId}, ${currentOrder}, NOW())
    `;

    // ── Matches ───────────────────────────────────────
    // Max beat Anna (explains the standings swap)
    await tx`
      INSERT INTO season_matches (season_id, team1_id, team2_id, winner_team_id, status, created)
      VALUES (${seasonId}, ${teamIds[1]}, ${teamIds[0]}, ${teamIds[1]}, 'completed', NOW() - interval '2 hours')
    `;
    // Lisa beat Tom
    await tx`
      INSERT INTO season_matches (season_id, team1_id, team2_id, winner_team_id, status, created)
      VALUES (${seasonId}, ${teamIds[2]}, ${teamIds[3]}, ${teamIds[2]}, 'completed', NOW() - interval '1 hour')
    `;
    // Julia challenged Felix (still open)
    await tx`
      INSERT INTO season_matches (season_id, team1_id, team2_id, winner_team_id, status, created)
      VALUES (${seasonId}, ${teamIds[4]}, ${teamIds[5]}, NULL, 'challenged', NOW())
    `;

    // ── Magic link for instant login ─────────────────
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await tx`
      INSERT INTO magic_links (player_id, token, expires_at)
      VALUES (${playerIds[0]}, ${token}, ${expiresAt})
    `;

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    console.log("Seeded successfully!");
    console.log(`Club: TC Beispiel (invite code: test-123)`);
    console.log(`Season: Einzel 2026 (${playerIds.length} players)`);
    console.log(`\nLogin with any of these emails:`);
    for (const p of players) {
      console.log(`  ${p.email} (${p.name})`);
    }
    console.log(`\nClick to login as ${players[0].name} (admin):`);
    console.log(`  ${appUrl}/api/auth/verify?token=${token}`);
  });
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
