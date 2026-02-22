import crypto from "crypto";
import postgres from "postgres";
// Ensures TransactionSql module augmentation is in compilation scope (see app/lib/db.ts)
import type { Sql as _Sql } from "../app/lib/db";

import { getOrCreatePlayer } from "../app/lib/db/player";
import { createClub, joinClub } from "../app/lib/db/club";
import {
  createSeason,
  startSeason,
  createNewPlayerEvent,
} from "../app/lib/db/season";
import {
  createChallenge,
  withdrawMatch,
  disputeMatchResult,
  createDateProposal,
  acceptDateProposal,
  createMatchComment,
} from "../app/lib/db/match";
import { challengeTeam } from "../app/lib/domain/challenge";
import { generateUniquePlayerSlug } from "../app/lib/db/auth";
import {
  submitResult,
  confirmResult,
  forfeitAndUpdateStandings,
} from "../app/lib/domain/match";

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
      t1.push(randomLosingScore());
      t2.push(6);
      t2Wins++;
    } else if (t2Wins === 1 && t1Wins < 2) {
      t1.push(6);
      t2.push(randomLosingScore());
      t1Wins++;
    } else if (i < sets - 1 && sets === 3 && t1Wins === 1 && t2Wins === 0) {
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

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
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

// ── Match definitions ────────────────────────────

type MatchDef = {
  /** team index of challenger (lower-ranked player initiating) */
  team1Idx: number;
  /** team index of challengee (higher-ranked player) */
  team2Idx: number;
  /** team index of winner */
  winnerIdx: number;
};

// Completed matches in chronological order.
// team1 is the challenger, team2 is the challengee.
const completedMatches: MatchDef[] = [
  // Week 1
  { team1Idx: 1, team2Idx: 0, winnerIdx: 1 },
  { team1Idx: 3, team2Idx: 2, winnerIdx: 2 },
  { team1Idx: 5, team2Idx: 4, winnerIdx: 5 },
  { team1Idx: 7, team2Idx: 6, winnerIdx: 7 },
  // Week 2
  { team1Idx: 2, team2Idx: 1, winnerIdx: 2 },
  { team1Idx: 4, team2Idx: 3, winnerIdx: 4 },
  { team1Idx: 9, team2Idx: 8, winnerIdx: 9 },
  { team1Idx: 11, team2Idx: 10, winnerIdx: 10 },
  // Week 3
  { team1Idx: 0, team2Idx: 2, winnerIdx: 0 },
  { team1Idx: 6, team2Idx: 5, winnerIdx: 5 },
  { team1Idx: 8, team2Idx: 7, winnerIdx: 8 },
  { team1Idx: 13, team2Idx: 12, winnerIdx: 13 },
  { team1Idx: 15, team2Idx: 14, winnerIdx: 14 },
  // Week 4
  { team1Idx: 1, team2Idx: 0, winnerIdx: 0 },
  { team1Idx: 3, team2Idx: 4, winnerIdx: 3 },
  { team1Idx: 10, team2Idx: 9, winnerIdx: 10 },
  { team1Idx: 12, team2Idx: 11, winnerIdx: 12 },
  { team1Idx: 16, team2Idx: 15, winnerIdx: 16 },
  { team1Idx: 18, team2Idx: 17, winnerIdx: 17 },
  // Recent
  { team1Idx: 5, team2Idx: 4, winnerIdx: 4 },
  { team1Idx: 14, team2Idx: 13, winnerIdx: 14 },
];

// ── Main seed function ───────────────────────────

async function seed() {
  await sql.begin(async (tx) => {
    // ── 1. Wipe existing data ──────────────────────
    await tx`DELETE FROM magic_links`;
    await tx`DELETE FROM sessions`;
    await tx`DELETE FROM event_reads`;
    await tx`DELETE FROM events`;
    await tx`DELETE FROM match_comments`;
    await tx`DELETE FROM date_proposals`;
    await tx`DELETE FROM season_standings`;
    await tx`DELETE FROM season_matches`;
    await tx`DELETE FROM team_players`;
    await tx`DELETE FROM teams`;
    await tx`DELETE FROM seasons`;
    await tx`DELETE FROM club_members`;
    await tx`DELETE FROM notification_preferences`;
    await tx`DELETE FROM clubs`;
    await tx`UPDATE player SET image_id = NULL`;
    await tx`DELETE FROM images`;
    await tx`DELETE FROM player`;

    // ── 2. Create players ──────────────────────────
    const players: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    }[] = [];
    for (const p of PLAYERS) {
      const player = await getOrCreatePlayer(tx, p);
      players.push(player);
    }
    const playerIds = players.map((p) => p.id);

    // ── 2b. Generate player slugs ────────────────────
    for (const p of players) {
      const slug = await generateUniquePlayerSlug(tx, p.firstName, p.lastName);
      await tx`UPDATE player SET slug = ${slug} WHERE id = ${p.id}`;
    }

    // ── 3. Create club ─────────────────────────────
    const { id: clubId } = await createClub(tx, {
      name: "TC Beispiel",
      inviteCode: "test-123",
    });

    // Set club contact details for a realistic club overview page
    await tx`
      UPDATE clubs SET
        url = 'https://tc-beispiel.at',
        phone_number = '+43 1 234 5678',
        address = 'Sportplatzgasse 12',
        city = 'Wien',
        zip = '1030',
        country = 'AT'
      WHERE id = ${clubId}
    `;

    // ── 4. Join club (all players) ─────────────────
    for (const playerId of playerIds) {
      await joinClub(tx, playerId, clubId);
    }
    // Make first player admin
    await tx`
      UPDATE club_members SET role = 'admin'
      WHERE player_id = ${playerIds[0]} AND club_id = ${clubId}
    `;

    // ── 5. Create season ───────────────────────────
    const { seasonId, teamIds } = await createSeason(tx, clubId, {
      name: "Einzel 2026",
      type: "individual",
      teamSize: 1,
      bestOf: 3,
      matchDeadlineDays: 14,
      reminderDays: 7,
      requiresConfirmation: true,
      openEnrollment: true,
      startingRanks: "empty",
      inviteCode: "JOIN26",
    });

    // createSeason returns teamIds in alphabetical order (by first_name).
    // Build a teamIdx → playerId map so match definitions can use team indices.
    const teamPlayerIds: number[] = [];
    for (const teamId of teamIds) {
      const [row] = await tx`
        SELECT player_id FROM team_players WHERE team_id = ${teamId}
      `;
      teamPlayerIds.push(row.player_id as number);
    }

    // ── 6. Start season ────────────────────────────
    const started = await startSeason(tx, seasonId, clubId);
    if (!started) {
      throw new Error(
        `Failed to start season ${seasonId} — season may not be in draft status`,
      );
    }

    // Season start event
    await tx`
      INSERT INTO events (club_id, season_id, event_type, created)
      VALUES (${clubId}, ${seasonId}, 'season_start', NOW())
    `;

    // New player events for all players
    for (let i = 0; i < players.length; i++) {
      await createNewPlayerEvent(
        tx,
        clubId,
        playerIds[i],
        {
          firstName: players[i].firstName,
          lastName: players[i].lastName,
          startingRank: i + 1,
        },
        seasonId,
      );
    }

    // ── 7. Process completed matches ───────────────
    // Each match goes through the full lifecycle:
    // challengeTeam → submitResult → confirmResult (includes standings update)
    const completedMatchIds: number[] = [];

    for (const m of completedMatches) {
      const challengerPlayerId = teamPlayerIds[m.team1Idx];
      const challengeePlayerId = teamPlayerIds[m.team2Idx];

      // Create challenge (validates pyramid rules + unavailability + open challenges)
      const matchId = await challengeTeam(tx, seasonId, clubId, {
        challengerTeamId: teamIds[m.team1Idx],
        challengeeTeamId: teamIds[m.team2Idx],
        challengerPlayerId,
        challengeePlayerId,
        challengeText: "",
      });

      // Generate score (winner gets the winning side)
      const score = winScore();
      const t1Score = m.winnerIdx === m.team1Idx ? score.t1 : score.t2;
      const t2Score = m.winnerIdx === m.team1Idx ? score.t2 : score.t1;

      // Result entered by winner
      const enteredBy = teamPlayerIds[m.winnerIdx];
      await submitResult(tx, matchId, enteredBy, t1Score, t2Score);

      // Confirmed by the opponent (updates standings atomically)
      const confirmedBy =
        m.winnerIdx === m.team1Idx ? challengeePlayerId : challengerPlayerId;
      await confirmResult(tx, matchId, confirmedBy);

      completedMatchIds.push(matchId);
    }

    // ── 8–13: Non-completed matches (various states) ──
    // Use createChallenge directly — these are test fixtures and the post-match
    // standings make some pyramid challenges invalid. Domain validation is tested
    // by the completed matches above.

    function seedChallenge(team1Idx: number, team2Idx: number) {
      return createChallenge(
        tx,
        seasonId,
        clubId,
        teamIds[team1Idx],
        teamIds[team2Idx],
        teamPlayerIds[team1Idx],
        teamPlayerIds[team2Idx],
        "",
      );
    }

    // ── 8. Forfeited match ─────────────────────────
    {
      const matchId = await seedChallenge(6, 5);
      await forfeitAndUpdateStandings(tx, matchId, teamPlayerIds[6]);
    }

    // ── 9. Withdrawn match ─────────────────────────
    {
      const matchId = await seedChallenge(19, 18);
      await withdrawMatch(
        tx,
        matchId,
        teamPlayerIds[19],
        clubId,
        seasonId,
        teamPlayerIds[18],
      );
    }

    // ── 10. Disputed match ─────────────────────────
    {
      const matchId = await seedChallenge(13, 12);
      const score = winScore();
      await submitResult(tx, matchId, teamPlayerIds[13], score.t1, score.t2);
      await disputeMatchResult(
        tx,
        matchId,
        teamPlayerIds[12],
        clubId,
        seasonId,
        teamPlayerIds[13],
        "Die Punkte im zweiten Satz stimmen nicht.",
      );
    }

    // ── 11. Pending confirmation match ─────────────
    {
      const matchId = await seedChallenge(7, 6);
      const score = winScore();
      await submitResult(tx, matchId, teamPlayerIds[7], score.t1, score.t2);
    }

    // ── 12. Open challenges ────────────────────────
    const challengedMatch1Id = await seedChallenge(9, 10);
    const challengedMatch2Id = await seedChallenge(14, 11);
    await seedChallenge(17, 16);

    // ── 13. Date set match ─────────────────────────
    const dateSetMatchId = await seedChallenge(15, 13);

    const proposalId = await createDateProposal(
      tx,
      dateSetMatchId,
      clubId,
      seasonId,
      teamPlayerIds[15],
      teamPlayerIds[13],
      daysFromNow(3),
    );

    await acceptDateProposal(
      tx,
      proposalId,
      dateSetMatchId,
      clubId,
      seasonId,
      teamPlayerIds[13],
      teamPlayerIds[15],
    );

    // ── 14. Additional date proposals on open matches ──
    // Proposals for challengedMatch1 (Jonas vs Laura)
    await createDateProposal(
      tx,
      challengedMatch1Id,
      clubId,
      seasonId,
      teamPlayerIds[9],
      teamPlayerIds[10],
      daysFromNow(2),
    );
    await createDateProposal(
      tx,
      challengedMatch1Id,
      clubId,
      seasonId,
      teamPlayerIds[10],
      teamPlayerIds[9],
      daysFromNow(4),
    );

    // Proposals for challengedMatch2 (Emma vs David, one declined via raw SQL)
    const declinedProposalId = await createDateProposal(
      tx,
      challengedMatch2Id,
      clubId,
      seasonId,
      teamPlayerIds[14],
      teamPlayerIds[11],
      daysFromNow(1),
    );
    await tx`UPDATE date_proposals SET status = 'declined' WHERE id = ${declinedProposalId}`;

    await createDateProposal(
      tx,
      challengedMatch2Id,
      clubId,
      seasonId,
      teamPlayerIds[11],
      teamPlayerIds[14],
      daysFromNow(5),
    );

    // ── 15. Comments on matches ────────────────────
    const commentTargets = [
      ...completedMatchIds.slice(0, 5),
      challengedMatch1Id,
      challengedMatch2Id,
    ];
    for (const matchId of commentTargets) {
      const numComments = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numComments; i++) {
        const playerId = pick(playerIds);
        await createMatchComment(tx, matchId, playerId, pick(COMMENTS));
      }
    }

    // ── 16. Backdate events + matches for realistic timestamps ──
    // Spread events across days so the club overview "Recent Activity"
    // section shows varied relative timestamps (hours, days).
    {
      const allEvents = await tx`
        SELECT id FROM events
        WHERE club_id = ${clubId}
        ORDER BY id ASC
      `;

      // Assign timestamps: oldest events → weeks ago, newest → hours ago
      const total = allEvents.length;
      for (let i = 0; i < total; i++) {
        // Spread from ~30 days ago to ~1 hour ago
        const fraction = i / Math.max(total - 1, 1);
        const hoursBack = Math.round(30 * 24 * (1 - fraction) + 1);
        await tx`
          UPDATE events SET created = ${hoursAgo(hoursBack)}
          WHERE id = ${allEvents[i].id}
        `;
      }

      // Also backdate match created timestamps to match their events
      const allMatches = await tx`
        SELECT id FROM season_matches
        WHERE season_id = ${seasonId}
        ORDER BY id ASC
      `;
      const matchTotal = allMatches.length;
      for (let i = 0; i < matchTotal; i++) {
        const fraction = i / Math.max(matchTotal - 1, 1);
        const hoursBack = Math.round(28 * 24 * (1 - fraction) + 2);
        await tx`
          UPDATE season_matches SET created = ${hoursAgo(hoursBack)}
          WHERE id = ${allMatches[i].id}
        `;
      }
    }

    // ── 17. Add announcement event ──────────────────
    await tx`
      INSERT INTO events (club_id, season_id, player_id, event_type, metadata, created)
      VALUES (
        ${clubId},
        ${seasonId},
        ${playerIds[0]},
        'announcement',
        ${tx.json({ message: "Platzpflege am Samstag 10:00 \u2014 bitte helft mit!" })},
        ${hoursAgo(4)}
      )
    `;

    // ── 18. Set read watermark so some events appear unread ──
    // Mark player[0] (Anna) as having read events up to 12 hours ago
    // so recent events show as unread in her activity feed.
    await tx`
      INSERT INTO event_reads (player_id, club_id, last_read_at)
      VALUES (${playerIds[0]}, ${clubId}, ${hoursAgo(12)})
    `;

    // ── 19. Magic links for quick login ─────────────
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
    console.log(`\nSeason invite link: ${appUrl}/season/join?code=JOIN26`);
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
