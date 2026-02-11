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
    title: "Julia Fischer hat gegen Anna Schmidt gewonnen",
    description: "6:3, 7:5",
    timestamp: "Vor 2 Stunden",
    player: { name: "Julia Fischer" },
  },
  {
    id: "e2",
    type: "challenge",
    title: "Tom Weber fordert Anna Schmidt heraus",
    timestamp: "Vor 5 Stunden",
    player: { name: "Tom Weber" },
  },
  {
    id: "e3",
    type: "withdrawal",
    title: "Felix Wagner zieht Forderung zurück",
    description: "Forderung gegen Paul Becker zurückgezogen",
    timestamp: "Gestern",
    player: { name: "Felix Wagner" },
  },
  {
    id: "e4",
    type: "forfeit",
    title: "Marie Koch gibt auf",
    description: "Spiel gegen Laura Richter aufgegeben",
    timestamp: "Gestern",
    player: { name: "Marie Koch" },
  },
  {
    id: "e5",
    type: "rank_change",
    title: "Tom Weber steigt auf Rang 2",
    description: "Nach Sieg gegen Anna Schmidt",
    timestamp: "Vor 2 Tagen",
  },
  {
    id: "e6",
    type: "new_player",
    title: "Emma Bauer tritt dem Verein bei",
    timestamp: "Vor 3 Tagen",
    player: { name: "Emma Bauer" },
  },
  {
    id: "e7",
    type: "season_start",
    title: "Sommer 2026 hat begonnen",
    description: "24 Spieler nehmen teil",
    timestamp: "Vor 1 Woche",
  },
  {
    id: "e8",
    type: "unavailable",
    title: "Sophie Hoffmann ist abwesend",
    description: "Bis 15.03.2026",
    timestamp: "Vor 1 Woche",
    player: { name: "Sophie Hoffmann" },
  },
  {
    id: "e9",
    type: "season_end",
    title: "Winter 2025/26 ist beendet",
    description: "Julia Fischer gewinnt die Saison",
    timestamp: "Vor 2 Wochen",
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

// ── Notifications ────────────────────────────

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  avatarName: string;
};

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "Lisa Müller hat deine Forderung angenommen",
    description: "Schlage einen Termin vor",
    timestamp: "Vor 10 Minuten",
    read: false,
    avatarName: "Lisa Müller",
  },
  {
    id: "n2",
    title: "Neues Ergebnis eingetragen",
    description: "Julia Fischer vs Anna Schmidt — 6:3, 7:5",
    timestamp: "Vor 2 Stunden",
    read: false,
    avatarName: "Julia Fischer",
  },
  {
    id: "n3",
    title: "Sophie Hoffmann ist wieder verfügbar",
    description: "Du kannst sie jetzt herausfordern",
    timestamp: "Vor 5 Stunden",
    read: false,
    avatarName: "Sophie Hoffmann",
  },
  {
    id: "n4",
    title: "Tom Weber fordert Anna Schmidt heraus",
    description: "Rang 3 fordert Rang 2",
    timestamp: "Gestern",
    read: true,
    avatarName: "Tom Weber",
  },
  {
    id: "n5",
    title: "Saisonstart: Sommer 2026",
    description: "Die neue Saison hat begonnen",
    timestamp: "Vor 1 Woche",
    read: true,
    avatarName: "TC Musterstadt",
  },
  {
    id: "n6",
    title: "Felix Wagner zieht Forderung zurück",
    description: "Forderung gegen Paul Becker",
    timestamp: "Vor 1 Woche",
    read: true,
    avatarName: "Felix Wagner",
  },
];

// ── Rank chart data ──────────────────────────

export const rankChartData: RankDataPoint[] = [
  { date: "Okt", rank: 10 },
  { date: "Nov", rank: 8 },
  { date: "Dez", rank: 7 },
  { date: "Jan", rank: 6 },
  { date: "Feb", rank: 5 },
];
