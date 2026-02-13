import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

const sql = postgres(DATABASE_URL);

async function seed() {
  await sql.begin(async (tx) => {
    // ── Club ──────────────────────────────────────────
    const [club] = await tx`
      INSERT INTO clubs (name, invite_code, is_disabled, created)
      VALUES ('TC Beispiel', 'test-123', false, NOW())
      ON CONFLICT (invite_code) DO UPDATE SET name = EXCLUDED.name
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
        ON CONFLICT (email_address) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      playerIds.push(row.id);
    }

    // ── Club memberships ──────────────────────────────
    for (const playerId of playerIds) {
      await tx`
        INSERT INTO club_members (player_id, club_id, role, created)
        VALUES (${playerId}, ${clubId}, 'player', NOW())
        ON CONFLICT DO NOTHING
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
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    // If season already existed, fetch it
    const seasonId =
      season?.id ??
      (
        await tx`SELECT id FROM seasons WHERE club_id = ${clubId} AND name = 'Einzel 2026'`
      )[0].id;

    // ── Teams (one per player for individual season) ──
    const teamIds: number[] = [];
    for (const playerId of playerIds) {
      // Check if already enrolled
      const existing = await tx`
        SELECT t.id FROM teams t
        JOIN team_players tp ON tp.team_id = t.id
        WHERE t.season_id = ${seasonId} AND tp.player_id = ${playerId}
      `;
      if (existing.length > 0) {
        teamIds.push(existing[0].id);
        continue;
      }

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

    console.log("Seeded successfully!");
    console.log(`Club: TC Beispiel (invite code: test-123)`);
    console.log(`Season: Einzel 2026 (${playerIds.length} players)`);
    console.log(`\nLogin with any of these emails:`);
    for (const p of players) {
      console.log(`  ${p.email} (${p.name})`);
    }
  });
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
