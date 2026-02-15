import type { PyramidPlayer } from "@/components/domain/pyramid-grid";
import type { StandingsPlayer } from "@/components/domain/standings-table";
import type { RankDataPoint } from "@/components/domain/rank-chart";

// ── Re-export shared fixtures ──────────────────

export {
  rankedPlayers as players,
  currentPlayer,
  toPyramidPlayers,
  toStandingsPlayers,
} from "../__fixtures__/players";

export { clubs, seasons } from "../__fixtures__/seasons";
export { feedEvents, allEvents } from "../__fixtures__/events";
export { matchList as matches } from "../__fixtures__/matches";

// ── Derived from shared fixtures ───────────────

import { rankedPlayers, currentPlayer } from "../__fixtures__/players";

export const pyramidPlayers: PyramidPlayer[] = rankedPlayers.map((p) => ({
  ...p,
  variant:
    p.id === currentPlayer.id
      ? ("current" as const)
      : p.rank === 4
        ? ("challengeable" as const)
        : p.rank === 3
          ? ("challengeable" as const)
          : ("default" as const),
}));

export const standingsPlayers: StandingsPlayer[] = rankedPlayers.map((p) => ({
  ...p,
  movement:
    p.rank <= 3
      ? ("up" as const)
      : p.rank >= 10
        ? ("down" as const)
        : ("none" as const),
  challengeable: p.rank === 3 || p.rank === 4,
}));

// ── Historical pyramid & standings (before match m3) ──

const historicalPlayers = [
  {
    id: "p1",
    firstName: "Julia",
    lastName: "Fischer",
    rank: 2,
    wins: 11,
    losses: 2,
  },
  {
    id: "p2",
    firstName: "Anna",
    lastName: "Schmidt",
    rank: 1,
    wins: 10,
    losses: 3,
  },
  {
    id: "p3",
    firstName: "Tom",
    lastName: "Weber",
    rank: 3,
    wins: 9,
    losses: 5,
  },
  {
    id: "p4",
    firstName: "Lisa",
    lastName: "Müller",
    rank: 5,
    wins: 7,
    losses: 5,
  },
  {
    id: "p5",
    firstName: "Max",
    lastName: "Braun",
    rank: 4,
    wins: 7,
    losses: 6,
  },
  {
    id: "p6",
    firstName: "Sophie",
    lastName: "Hoffmann",
    rank: 7,
    wins: 6,
    losses: 7,
  },
  {
    id: "p7",
    firstName: "Paul",
    lastName: "Becker",
    rank: 6,
    wins: 6,
    losses: 7,
  },
  {
    id: "p8",
    firstName: "Laura",
    lastName: "Richter",
    rank: 9,
    wins: 5,
    losses: 8,
  },
  {
    id: "p9",
    firstName: "Felix",
    lastName: "Wagner",
    rank: 8,
    wins: 5,
    losses: 8,
  },
  {
    id: "p10",
    firstName: "Marie",
    lastName: "Koch",
    rank: 10,
    wins: 3,
    losses: 10,
  },
  {
    id: "p11",
    firstName: "Lukas",
    lastName: "Schäfer",
    rank: 12,
    wins: 1,
    losses: 11,
  },
  {
    id: "p12",
    firstName: "Emma",
    lastName: "Bauer",
    rank: 11,
    wins: 2,
    losses: 10,
  },
] as const;

export const pyramidPlayersHistorical: PyramidPlayer[] = historicalPlayers.map(
  (p) => ({
    ...p,
    variant:
      p.id === currentPlayer.id
        ? ("current" as const)
        : p.rank === 3 || p.rank === 5
          ? ("challengeable" as const)
          : ("default" as const),
  }),
);

export const standingsPlayersHistorical: StandingsPlayer[] =
  historicalPlayers.map((p) => ({
    ...p,
    movement:
      p.rank <= 2
        ? ("up" as const)
        : p.rank >= 11
          ? ("down" as const)
          : ("none" as const),
    challengeable: p.rank === 3 || p.rank === 5,
  }));

// ── Large pyramid (25 players) ───────────────

const bigPlayerNames = [
  ["Julia", "Fischer"],
  ["Anna", "Schmidt"],
  ["Tom", "Weber"],
  ["Lisa", "Müller"],
  ["Max", "Braun"],
  ["Sophie", "Hoffmann"],
  ["Paul", "Becker"],
  ["Laura", "Richter"],
  ["Felix", "Wagner"],
  ["Marie", "Koch"],
  ["Lukas", "Schäfer"],
  ["Emma", "Bauer"],
  ["Nico", "Hartmann"],
  ["Lena", "Fuchs"],
  ["Moritz", "Krause"],
  ["Clara", "Vogel"],
  ["Jonas", "Meier"],
  ["Lea", "Wolf"],
  ["Tim", "Schulz"],
  ["Nina", "Berger"],
  ["David", "Roth"],
  ["Sarah", "Lang"],
  ["Finn", "Peters"],
  ["Mia", "Schwarz"],
  ["Jan", "Weiß"],
] as const;

export const bigPlayers = bigPlayerNames.map(([firstName, lastName], i) => ({
  id: `bp${i + 1}`,
  firstName,
  lastName,
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
