import type { TimelineEvent } from "@/components/domain/event-timeline";
import type { MatchRowProps } from "@/components/domain/match-row";
import type { PyramidPlayer } from "@/components/domain/pyramid-grid";
import type { StandingsPlayer } from "@/components/domain/standings-table";
import type { Season } from "@/components/domain/season-selector";
import type { RankDataPoint } from "@/components/domain/rank-chart";
import type { Club } from "@/components/club-switcher";

// ── Players ──────────────────────────────────

export const players = [
  { id: "p1", name: "Julia Fischer", rank: 1, wins: 12, losses: 2 },
  { id: "p2", name: "Anna Schmidt", rank: 2, wins: 10, losses: 4 },
  { id: "p3", name: "Tom Weber", rank: 3, wins: 9, losses: 5 },
  { id: "p4", name: "Lisa Müller", rank: 4, wins: 8, losses: 5 },
  { id: "p5", name: "Max Braun", rank: 5, wins: 7, losses: 6 },
  { id: "p6", name: "Sophie Hoffmann", rank: 6, wins: 7, losses: 7 },
  { id: "p7", name: "Paul Becker", rank: 7, wins: 6, losses: 7 },
  { id: "p8", name: "Laura Richter", rank: 8, wins: 5, losses: 8 },
  { id: "p9", name: "Felix Wagner", rank: 9, wins: 4, losses: 9 },
  { id: "p10", name: "Marie Koch", rank: 10, wins: 3, losses: 10 },
  { id: "p11", name: "Lukas Schäfer", rank: 11, wins: 2, losses: 10 },
  { id: "p12", name: "Emma Bauer", rank: 12, wins: 1, losses: 11 },
] as const;

export const currentPlayer = {
  id: "p5",
  name: "Max Braun",
  rank: 5,
  wins: 7,
  losses: 6,
  totalMatches: 13,
  winRate: "54%",
  email: "max.braun@example.com",
  phone: "+49 170 1234567",
};

// ── Clubs ────────────────────────────────────

export const clubs: Club[] = [
  { id: "c1", name: "TC Musterstadt" },
  { id: "c2", name: "SC Grünwald" },
];

// ── Seasons ──────────────────────────────────

export const seasons: Season[] = [
  { id: "s1", name: "Sommer 2026" },
  { id: "s2", name: "Winter 2025/26", archived: true },
  { id: "s3", name: "Sommer 2025", archived: true },
];

// ── Feed events ──────────────────────────────

export const feedEvents: TimelineEvent[] = [
  {
    id: "e1",
    type: "result",
    player1: { name: "Julia Fischer" },
    player2: { name: "Anna Schmidt" },
    winnerId: "player1",
    scores: [[6, 3], [7, 5]],
    rankBefore: 2,
    rankAfter: 1,
    time: "14:30",
    group: "Heute",
    groupDate: "12.02.2026",
    href: "/matches/m3",
  },
  {
    id: "e2",
    type: "challenge",
    challenger: { name: "Tom Weber" },
    challengee: { name: "Anna Schmidt" },
    time: "11:45",
    group: "Heute",
    groupDate: "12.02.2026",
    href: "/matches/m2",
  },
  {
    id: "e3",
    type: "withdrawal",
    player: { name: "Felix Wagner" },
    opponent: { name: "Paul Becker" },
    reason: "Terminkonflikt",
    time: "16:20",
    group: "Gestern",
    groupDate: "11.02.2026",
    href: "/matches/m5",
  },
  {
    id: "e4",
    type: "forfeit",
    player: { name: "Marie Koch" },
    opponent: { name: "Laura Richter" },
    reason: "Verletzung",
    time: "09:15",
    group: "Gestern",
    groupDate: "11.02.2026",
    href: "/matches/m6",
  },
  {
    id: "e6",
    type: "new_player",
    player: { name: "Emma Bauer" },
    startingRank: 12,
    time: "10:30",
    group: "Vor 3 Tagen",
    groupDate: "09.02.2026",
    href: "/player/p12",
  },
  {
    id: "e7",
    type: "season_start",
    seasonName: "Sommer 2026",
    playerCount: 24,
    time: "08:00",
    group: "Letzte Woche",
    groupDate: "05.02.2026",
  },
  {
    id: "e8",
    type: "unavailable",
    player: { name: "Sophie Hoffmann" },
    returnDate: "15.03.2026",
    time: "12:00",
    group: "Letzte Woche",
    groupDate: "05.02.2026",
    href: "/player/p6",
  },
  {
    id: "e9",
    type: "season_end",
    seasonName: "Winter 2025/26",
    winnerName: "Julia Fischer",
    time: "17:00",
    group: "Vor 2 Wochen",
    groupDate: "29.01.2026",
  },
];

// ── Matches ──────────────────────────────────

export const matches: (MatchRowProps & { id: string })[] = [
  {
    id: "m1",
    player1: { name: "Max Braun" },
    player2: { name: "Lisa Müller" },
    status: "challenged",
    date: "Offen seit 03.02.2026",
  },
  {
    id: "m2",
    player1: { name: "Tom Weber" },
    player2: { name: "Anna Schmidt" },
    status: "date_set",
    date: "15.02.2026, 18:00",
  },
  {
    id: "m3",
    player1: { name: "Julia Fischer" },
    player2: { name: "Anna Schmidt" },
    status: "completed",
    winnerId: "player1",
    scores: [[6, 3], [7, 5]],
    date: "10.02.2026",
  },
  {
    id: "m4",
    player1: { name: "Max Braun" },
    player2: { name: "Sophie Hoffmann" },
    status: "completed",
    winnerId: "player2",
    scores: [[4, 6], [3, 6]],
    date: "05.02.2026",
  },
  {
    id: "m5",
    player1: { name: "Felix Wagner" },
    player2: { name: "Paul Becker" },
    status: "withdrawn",
    date: "01.02.2026",
  },
  {
    id: "m6",
    player1: { name: "Marie Koch" },
    player2: { name: "Laura Richter" },
    status: "forfeited",
    date: "28.01.2026",
  },
  {
    id: "m7",
    player1: { name: "Max Braun" },
    player2: { name: "Tom Weber" },
    status: "completed",
    winnerId: "player1",
    scores: [[6, 4], [6, 2]],
    date: "20.01.2026",
  },
  {
    id: "m8",
    player1: { name: "Lukas Schäfer" },
    player2: { name: "Emma Bauer" },
    status: "challenged",
    date: "Offen seit 08.02.2026",
  },
];

// ── Pyramid & standings players ──────────────

export const pyramidPlayers: PyramidPlayer[] = players.map((p, i) => ({
  ...p,
  variant: p.id === currentPlayer.id
    ? "current" as const
    : p.rank === 4
      ? "challengeable" as const
      : p.rank === 3
        ? "challengeable" as const
        : "default" as const,
}));

export const standingsPlayers: StandingsPlayer[] = players.map((p) => ({
  ...p,
  movement: p.rank <= 3
    ? "up" as const
    : p.rank >= 10
      ? "down" as const
      : "none" as const,
  challengeable: p.rank === 3 || p.rank === 4,
}));

// ── Historical pyramid & standings (before match m3) ──

const historicalPlayers = [
  { id: "p1", name: "Julia Fischer", rank: 2, wins: 11, losses: 2 },
  { id: "p2", name: "Anna Schmidt", rank: 1, wins: 10, losses: 3 },
  { id: "p3", name: "Tom Weber", rank: 3, wins: 9, losses: 5 },
  { id: "p4", name: "Lisa Müller", rank: 5, wins: 7, losses: 5 },
  { id: "p5", name: "Max Braun", rank: 4, wins: 7, losses: 6 },
  { id: "p6", name: "Sophie Hoffmann", rank: 7, wins: 6, losses: 7 },
  { id: "p7", name: "Paul Becker", rank: 6, wins: 6, losses: 7 },
  { id: "p8", name: "Laura Richter", rank: 9, wins: 5, losses: 8 },
  { id: "p9", name: "Felix Wagner", rank: 8, wins: 5, losses: 8 },
  { id: "p10", name: "Marie Koch", rank: 10, wins: 3, losses: 10 },
  { id: "p11", name: "Lukas Schäfer", rank: 12, wins: 1, losses: 11 },
  { id: "p12", name: "Emma Bauer", rank: 11, wins: 2, losses: 10 },
] as const;

export const pyramidPlayersHistorical: PyramidPlayer[] = historicalPlayers.map((p) => ({
  ...p,
  variant: p.id === currentPlayer.id
    ? "current" as const
    : p.rank === 3 || p.rank === 5
      ? "challengeable" as const
      : "default" as const,
}));

export const standingsPlayersHistorical: StandingsPlayer[] = historicalPlayers.map((p) => ({
  ...p,
  movement: p.rank <= 2
    ? "up" as const
    : p.rank >= 11
      ? "down" as const
      : "none" as const,
  challengeable: p.rank === 3 || p.rank === 5,
}));

// ── Combined feed (chronological) ───────────

export const allEvents: TimelineEvent[] = [
  {
    id: "n1",
    type: "challenge",
    challenger: { name: "Max Braun" },
    challengee: { name: "Lisa Müller" },
    time: "16:50",
    group: "Heute",
    groupDate: "12.02.2026",
    unread: true,
    href: "/matches/m1",
  },
  {
    id: "e1",
    type: "result",
    player1: { name: "Julia Fischer" },
    player2: { name: "Anna Schmidt" },
    winnerId: "player1",
    scores: [[6, 3], [7, 5]],
    rankBefore: 2,
    rankAfter: 1,
    time: "14:30",
    group: "Heute",
    groupDate: "12.02.2026",
    unread: true,
    href: "/matches/m3",
  },
  {
    id: "n3",
    type: "unavailable",
    player: { name: "Sophie Hoffmann" },
    time: "11:45",
    group: "Heute",
    groupDate: "12.02.2026",
    unread: true,
    href: "/player/p6",
  },
  {
    id: "e2",
    type: "challenge",
    challenger: { name: "Tom Weber" },
    challengee: { name: "Anna Schmidt" },
    time: "11:00",
    group: "Heute",
    groupDate: "12.02.2026",
    href: "/matches/m2",
  },
  {
    id: "e3",
    type: "withdrawal",
    player: { name: "Felix Wagner" },
    opponent: { name: "Paul Becker" },
    reason: "Terminkonflikt",
    time: "16:20",
    group: "Gestern",
    groupDate: "11.02.2026",
    href: "/matches/m5",
  },
  {
    id: "e4",
    type: "forfeit",
    player: { name: "Marie Koch" },
    opponent: { name: "Laura Richter" },
    reason: "Verletzung",
    time: "09:15",
    group: "Gestern",
    groupDate: "11.02.2026",
    href: "/matches/m6",
  },
  {
    id: "e6",
    type: "new_player",
    player: { name: "Emma Bauer" },
    startingRank: 12,
    time: "10:30",
    group: "Vor 3 Tagen",
    groupDate: "09.02.2026",
    href: "/player/p12",
  },
  {
    id: "e7",
    type: "season_start",
    seasonName: "Sommer 2026",
    playerCount: 24,
    time: "08:00",
    group: "Letzte Woche",
    groupDate: "05.02.2026",
  },
  {
    id: "e8",
    type: "unavailable",
    player: { name: "Sophie Hoffmann" },
    returnDate: "15.03.2026",
    time: "12:00",
    group: "Letzte Woche",
    groupDate: "05.02.2026",
    href: "/player/p6",
  },
  {
    id: "e9",
    type: "season_end",
    seasonName: "Winter 2025/26",
    winnerName: "Julia Fischer",
    time: "17:00",
    group: "Vor 2 Wochen",
    groupDate: "29.01.2026",
  },
];

// ── Large pyramid (25 players) ───────────────

const bigPlayerNames = [
  "Julia Fischer", "Anna Schmidt", "Tom Weber", "Lisa Müller",
  "Max Braun", "Sophie Hoffmann", "Paul Becker", "Laura Richter",
  "Felix Wagner", "Marie Koch", "Lukas Schäfer", "Emma Bauer",
  "Nico Hartmann", "Lena Fuchs", "Moritz Krause", "Clara Vogel",
  "Jonas Meier", "Lea Wolf", "Tim Schulz", "Nina Berger",
  "David Roth", "Sarah Lang", "Finn Peters", "Mia Schwarz",
  "Jan Weiß",
];

export const bigPlayers = bigPlayerNames.map((name, i) => ({
  id: `bp${i + 1}`,
  name,
  rank: i + 1,
  wins: Math.max(0, 20 - i * 2 + Math.floor(Math.random() * 4)),
  losses: Math.max(0, i * 2 - 3 + Math.floor(Math.random() * 4)),
}));

export const bigPyramidPlayers: PyramidPlayer[] = bigPlayers.map((p) => ({
  ...p,
  variant:
    p.id === "bp5"
      ? ("current" as const)
      : p.rank === 3 || p.rank === 4
        ? ("challengeable" as const)
        : p.rank === 18
          ? ("unavailable" as const)
          : ("default" as const),
}));

export const bigStandingsPlayers: StandingsPlayer[] = bigPlayers.map((p) => ({
  ...p,
  movement:
    p.rank <= 3
      ? ("up" as const)
      : p.rank >= 22
        ? ("down" as const)
        : ("none" as const),
  challengeable: p.rank === 3 || p.rank === 4,
}));

// ── Rank chart data ──────────────────────────

export const rankChartData: RankDataPoint[] = [
  { date: "Okt", rank: 10 },
  { date: "Nov", rank: 8 },
  { date: "Dez", rank: 7 },
  { date: "Jan", rank: 6 },
  { date: "Feb", rank: 5 },
];
