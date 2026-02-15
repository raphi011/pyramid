import crypto from "crypto";
import postgres from "postgres";
// Ensures TransactionSql module augmentation is in compilation scope (see app/lib/db.ts)
import type { Sql as _Sql } from "../app/lib/db";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://pyramid:pyramid@localhost:5433/pyramid_dev";

const sql = postgres(DATABASE_URL);

// ── Helpers ──────────────────────────────────────

/** Generate a random best-of-3 score where team1 wins */
function winScore(): { t1: number[]; t2: number[] } {
  // 2-0 or 2-1
  const sets = Math.random() < 0.5 ? 2 : 3;
  const t1: number[] = [];
  const t2: number[] = [];
  let t1Wins = 0;
  let t2Wins = 0;
  for (let i = 0; i < sets; i++) {
    if (t1Wins === 2) {
      // team2 must win this set (only happens in 2-1 scenario filling)
      t1.push(randomLosingScore());
      t2.push(6);
      t2Wins++;
    } else if (t2Wins === 1 && t1Wins < 2) {
      // team1 must win remaining
      t1.push(6);
      t2.push(randomLosingScore());
      t1Wins++;
    } else if (i < sets - 1 && sets === 3 && t1Wins === 1 && t2Wins === 0) {
      // team2 wins this set to make it 1-1
      t1.push(randomLosingScore());
      t2.push(6);
      t2Wins++;
    } else {
      t1.push(6);
      t2.push(randomLosingScore());
      t1Wins++;
    }
  }
  return { t1, t2 };
}

function randomLosingScore(): number {
  return Math.floor(Math.random() * 5); // 0-4
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Seed data ────────────────────────────────────

const PLAYERS = [
  { firstName: "Anna", lastName: "Müller", email: "anna@example.com" },
  { firstName: "Max", lastName: "Weber", email: "max@example.com" },
  { firstName: "Lisa", lastName: "Schmidt", email: "lisa@example.com" },
  { firstName: "Tom", lastName: "Fischer", email: "tom@example.com" },
  { firstName: "Julia", lastName: "Braun", email: "julia@example.com" },
  { firstName: "Felix", lastName: "Wagner", email: "felix@example.com" },
  { firstName: "Sophie", lastName: "Becker", email: "sophie@example.com" },
  { firstName: "Luca", lastName: "Hoffmann", email: "luca@example.com" },
  { firstName: "Marie", lastName: "Schäfer", email: "marie@example.com" },
  { firstName: "Jonas", lastName: "Koch", email: "jonas@example.com" },
  { firstName: "Laura", lastName: "Bauer", email: "laura@example.com" },
  { firstName: "David", lastName: "Richter", email: "david@example.com" },
  { firstName: "Lena", lastName: "Klein", email: "lena@example.com" },
  { firstName: "Niklas", lastName: "Wolf", email: "niklas@example.com" },
  { firstName: "Emma", lastName: "Schröder", email: "emma@example.com" },
  { firstName: "Paul", lastName: "Neumann", email: "paul@example.com" },
  { firstName: "Mia", lastName: "Schwarz", email: "mia@example.com" },
  { firstName: "Leon", lastName: "Zimmermann", email: "leon@example.com" },
  { firstName: "Hannah", lastName: "Krüger", email: "hannah@example.com" },
  { firstName: "Tim", lastName: "Hartmann", email: "tim@example.com" },
];

const COMMENTS = [
  "Gutes Spiel!",
  "Knappe Sache 💪",
  "Nächstes Mal gewinne ich!",
  "Wann passt es dir nächste Woche?",
  "Super gespielt!",
  "War ein tolles Match.",
  "Revanche? 😄",
  "Glückwunsch!",
  "Das war knapp!",
  "Nächste Woche wieder?",
];

// ── Main seed function ───────────────────────────

async function seed() {
  await sql.begin(async (tx) => {
    // ── Wipe existing data ───────────────────────────
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
    await tx`UPDATE player SET image_id = NULL`;
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
    const playerIds: number[] = [];
    for (const p of PLAYERS) {
      const [row] = await tx`
        INSERT INTO player (first_name, last_name, email_address, created)
        VALUES (${p.firstName}, ${p.lastName}, ${p.email}, NOW())
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
      INSERT INTO seasons (club_id, name, status, min_team_size, max_team_size, best_of, created, started_at)
      VALUES (${clubId}, 'Einzel 2026', 'active', 1, 1, 3, NOW(), ${daysAgo(30)})
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

    // ── Helper to get playerId for a teamId ──────────
    function playerIdForTeam(teamIdx: number): number {
      return playerIds[teamIdx];
    }

    // ── Initial standings (original pyramid order) ────
    await tx`
      INSERT INTO season_standings (season_id, results, created)
      VALUES (${seasonId}, ${teamIds}, ${daysAgo(28)})
    `;

    // ── Completed matches (with scores) ──────────────
    type MatchDef = {
      team1Idx: number;
      team2Idx: number;
      winnerIdx: number;
      daysAgo: number;
    };

    const completedMatches: MatchDef[] = [
      // Week 1 — early matches
      { team1Idx: 1, team2Idx: 0, winnerIdx: 1, daysAgo: 25 },
      { team1Idx: 3, team2Idx: 2, winnerIdx: 2, daysAgo: 24 },
      { team1Idx: 5, team2Idx: 4, winnerIdx: 5, daysAgo: 23 },
      { team1Idx: 7, team2Idx: 6, winnerIdx: 7, daysAgo: 22 },
      // Week 2
      { team1Idx: 2, team2Idx: 1, winnerIdx: 2, daysAgo: 20 },
      { team1Idx: 4, team2Idx: 3, winnerIdx: 4, daysAgo: 19 },
      { team1Idx: 9, team2Idx: 8, winnerIdx: 9, daysAgo: 18 },
      { team1Idx: 11, team2Idx: 10, winnerIdx: 10, daysAgo: 17 },
      // Week 3
      { team1Idx: 0, team2Idx: 2, winnerIdx: 0, daysAgo: 14 },
      { team1Idx: 6, team2Idx: 5, winnerIdx: 5, daysAgo: 13 },
      { team1Idx: 8, team2Idx: 7, winnerIdx: 8, daysAgo: 12 },
      { team1Idx: 13, team2Idx: 12, winnerIdx: 13, daysAgo: 11 },
      { team1Idx: 15, team2Idx: 14, winnerIdx: 14, daysAgo: 11 },
      // Week 4
      { team1Idx: 1, team2Idx: 0, winnerIdx: 0, daysAgo: 7 },
      { team1Idx: 3, team2Idx: 2, winnerIdx: 3, daysAgo: 6 },
      { team1Idx: 10, team2Idx: 9, winnerIdx: 10, daysAgo: 5 },
      { team1Idx: 12, team2Idx: 11, winnerIdx: 12, daysAgo: 4 },
      { team1Idx: 16, team2Idx: 15, winnerIdx: 16, daysAgo: 4 },
      { team1Idx: 18, team2Idx: 17, winnerIdx: 17, daysAgo: 3 },
      // Recent
      { team1Idx: 5, team2Idx: 4, winnerIdx: 4, daysAgo: 2 },
      { team1Idx: 14, team2Idx: 13, winnerIdx: 14, daysAgo: 1 },
    ];

    const matchIds: number[] = [];
    for (const m of completedMatches) {
      const score = winScore();
      // Swap scores if team2 is the winner
      const t1Score = m.winnerIdx === m.team1Idx ? score.t1 : score.t2;
      const t2Score = m.winnerIdx === m.team1Idx ? score.t2 : score.t1;
      const enteredBy = playerIdForTeam(m.winnerIdx);
      const confirmedBy = playerIdForTeam(
        m.winnerIdx === m.team1Idx ? m.team2Idx : m.team1Idx,
      );
      const gameAt = daysAgo(m.daysAgo);

      const [match] = await tx`
        INSERT INTO season_matches
          (season_id, team1_id, team2_id, winner_team_id, status,
           team1_score, team2_score, result_entered_by, result_entered_at,
           confirmed_by, game_at, created)
        VALUES
          (${seasonId}, ${teamIds[m.team1Idx]}, ${teamIds[m.team2Idx]},
           ${teamIds[m.winnerIdx]}, 'completed',
           ${t1Score}, ${t2Score}, ${enteredBy}, ${gameAt},
           ${confirmedBy}, ${gameAt}, ${gameAt})
        RETURNING id
      `;
      matchIds.push(match.id);
    }

    // ── Pending confirmation match ────────────────────
    {
      const score = winScore();
      const [match] = await tx`
        INSERT INTO season_matches
          (season_id, team1_id, team2_id, winner_team_id, status,
           team1_score, team2_score, result_entered_by, result_entered_at, created)
        VALUES
          (${seasonId}, ${teamIds[7]}, ${teamIds[6]}, ${teamIds[7]}, 'pending_confirmation',
           ${score.t1}, ${score.t2}, ${playerIds[7]}, ${hoursAgo(3)}, ${daysAgo(2)})
        RETURNING id
      `;
      matchIds.push(match.id);
    }

    // ── Open matches (challenged / date_set) ──────────
    // Challenged — no date yet
    const [challengedMatch1] = await tx`
      INSERT INTO season_matches
        (season_id, team1_id, team2_id, status, created)
      VALUES
        (${seasonId}, ${teamIds[9]}, ${teamIds[8]}, 'challenged', ${hoursAgo(12)})
      RETURNING id
    `;
    matchIds.push(challengedMatch1.id);

    const [challengedMatch2] = await tx`
      INSERT INTO season_matches
        (season_id, team1_id, team2_id, status, created)
      VALUES
        (${seasonId}, ${teamIds[11]}, ${teamIds[10]}, 'challenged', ${hoursAgo(6)})
      RETURNING id
    `;
    matchIds.push(challengedMatch2.id);

    const [challengedMatch3] = await tx`
      INSERT INTO season_matches
        (season_id, team1_id, team2_id, status, created)
      VALUES
        (${seasonId}, ${teamIds[17]}, ${teamIds[16]}, 'challenged', ${hoursAgo(2)})
      RETURNING id
    `;
    matchIds.push(challengedMatch3.id);

    // Date set
    const [dateSetMatch] = await tx`
      INSERT INTO season_matches
        (season_id, team1_id, team2_id, status, game_at, created)
      VALUES
        (${seasonId}, ${teamIds[15]}, ${teamIds[14]}, 'date_set',
         ${daysFromNow(3)}, ${daysAgo(1)})
      RETURNING id
    `;
    matchIds.push(dateSetMatch.id);

    // ── Withdrawn match ───────────────────────────────
    await tx`
      INSERT INTO season_matches
        (season_id, team1_id, team2_id, status, created)
      VALUES
        (${seasonId}, ${teamIds[19]}, ${teamIds[18]}, 'withdrawn', ${daysAgo(5)})
    `;

    // ── Forfeited match ───────────────────────────────
    await tx`
      INSERT INTO season_matches
        (season_id, team1_id, team2_id, winner_team_id, status, created)
      VALUES
        (${seasonId}, ${teamIds[6]}, ${teamIds[5]}, ${teamIds[5]}, 'forfeited', ${daysAgo(8)})
    `;

    // ── Disputed match ────────────────────────────────
    {
      const score = winScore();
      await tx`
        INSERT INTO season_matches
          (season_id, team1_id, team2_id, winner_team_id, status,
           team1_score, team2_score, result_entered_by, result_entered_at,
           disputed_reason, created)
        VALUES
          (${seasonId}, ${teamIds[13]}, ${teamIds[12]}, ${teamIds[13]}, 'disputed',
           ${score.t1}, ${score.t2}, ${playerIds[13]}, ${daysAgo(3)},
           'Die Punkte im zweiten Satz stimmen nicht.', ${daysAgo(4)})
      `;
    }

    // ── Date proposals ────────────────────────────────
    // Proposals for challengedMatch1
    await tx`
      INSERT INTO date_proposals (match_id, proposed_by, proposed_datetime, status, created)
      VALUES
        (${challengedMatch1.id}, ${playerIds[9]}, ${daysFromNow(2)}, 'pending', ${hoursAgo(10)}),
        (${challengedMatch1.id}, ${playerIds[8]}, ${daysFromNow(4)}, 'pending', ${hoursAgo(5)})
    `;

    // Proposals for challengedMatch2 (one declined)
    await tx`
      INSERT INTO date_proposals (match_id, proposed_by, proposed_datetime, status, created)
      VALUES
        (${challengedMatch2.id}, ${playerIds[11]}, ${daysFromNow(1)}, 'declined', ${hoursAgo(5)}),
        (${challengedMatch2.id}, ${playerIds[10]}, ${daysFromNow(5)}, 'pending', ${hoursAgo(3)})
    `;

    // Accepted proposal for dateSetMatch
    await tx`
      INSERT INTO date_proposals (match_id, proposed_by, proposed_datetime, status, created)
      VALUES
        (${dateSetMatch.id}, ${playerIds[15]}, ${daysFromNow(3)}, 'accepted', ${daysAgo(1)}),
        (${dateSetMatch.id}, ${playerIds[14]}, ${daysFromNow(7)}, 'dismissed', ${daysAgo(1)})
    `;

    // ── Comments on some matches ──────────────────────
    // Add comments to completed matches and open matches
    const commentTargets = [
      ...matchIds.slice(0, 5),
      challengedMatch1.id,
      challengedMatch2.id,
    ];
    for (const matchId of commentTargets) {
      const numComments = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numComments; i++) {
        const playerId = pick(playerIds);
        await tx`
          INSERT INTO match_comments (match_id, player_id, comment, created)
          VALUES (${matchId}, ${playerId}, ${pick(COMMENTS)}, ${hoursAgo(Math.floor(Math.random() * 48))})
        `;
      }
    }

    // ── Current standings (after all completed matches) ─
    // Anna at rank 8 (middle of pyramid) so challenge highlighting is visible
    const currentOrder = [
      teamIds[2], // Lisa — #1
      teamIds[1], // Max
      teamIds[4], // Julia
      teamIds[3], // Tom
      teamIds[5], // Felix
      teamIds[7], // Luca
      teamIds[8], // Marie
      teamIds[0], // Anna — #8 (middle)
      teamIds[6], // Sophie
      teamIds[9], // Jonas
      teamIds[10], // Laura
      teamIds[12], // Lena
      teamIds[11], // David
      teamIds[14], // Emma
      teamIds[13], // Niklas
      teamIds[16], // Mia
      teamIds[15], // Paul
      teamIds[17], // Leon
      teamIds[19], // Tim
      teamIds[18], // Hannah
    ];
    await tx`
      INSERT INTO season_standings (season_id, results, created)
      VALUES (${seasonId}, ${currentOrder}, NOW())
    `;

    // ── Events ────────────────────────────────────────
    // Season start
    await tx`
      INSERT INTO events (club_id, season_id, event_type, created)
      VALUES (${clubId}, ${seasonId}, 'season_start', ${daysAgo(30)})
    `;

    // Challenge events for open matches
    for (const m of [challengedMatch1, challengedMatch2, challengedMatch3]) {
      await tx`
        INSERT INTO events (club_id, season_id, match_id, player_id, event_type, created)
        VALUES (${clubId}, ${seasonId}, ${m.id}, ${playerIds[0]}, 'challenge', NOW())
      `;
    }

    // Result events for some completed matches
    for (let i = 0; i < 5; i++) {
      await tx`
        INSERT INTO events (club_id, season_id, match_id, event_type, created)
        VALUES (${clubId}, ${seasonId}, ${matchIds[i]}, 'result', ${daysAgo(completedMatches[i].daysAgo)})
      `;
    }

    // ── Magic links for quick login ──────────────────
    const tokens: { name: string; token: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await tx`
        INSERT INTO magic_links (player_id, token, expires_at)
        VALUES (${playerIds[i]}, ${token}, ${expiresAt})
      `;
      tokens.push({
        name: `${PLAYERS[i].firstName} ${PLAYERS[i].lastName}`,
        token,
      });
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    console.log("Seeded successfully!");
    console.log(`Club: TC Beispiel (invite code: test-123)`);
    console.log(
      `Season: Einzel 2026 (${PLAYERS.length} players, ${completedMatches.length} completed matches)`,
    );
    console.log(`\nLogin with any of these emails:`);
    for (const p of PLAYERS) {
      console.log(`  ${p.email} (${p.firstName} ${p.lastName})`);
    }
    console.log(`\nQuick login links:`);
    for (const t of tokens) {
      console.log(`  ${t.name}: ${appUrl}/api/auth/verify?token=${t.token}`);
    }
  });
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
