import type { MatchRowProps } from "@/components/domain/match-row";
import type { SetScore } from "@/components/domain/match-score-input";
import { maxMustermann, annaSchmidt, maxBraun, lisaMueller, tomWeber, sophieHoffmann, felixWagner, paulBecker, marieKoch, lauraRichter, juliaFischer, lukasSchaefer, emmaBauer } from "./players";

// ── Match rows (per status) ────────────────────

export const challengedMatch: MatchRowProps = {
  player1: maxMustermann,
  player2: annaSchmidt,
  status: "challenged",
};

export const dateSetMatch: MatchRowProps = {
  player1: maxMustermann,
  player2: annaSchmidt,
  status: "date_set",
  date: "Sa, 15.03.2026",
};

export const completedWinMatch: MatchRowProps = {
  player1: maxMustermann,
  player2: annaSchmidt,
  status: "completed",
  winnerId: "player1",
  scores: [[6, 4], [3, 6], [7, 5]],
  date: "12.03.2026",
};

export const completedLossMatch: MatchRowProps = {
  player1: maxMustermann,
  player2: annaSchmidt,
  status: "completed",
  winnerId: "player2",
  scores: [[4, 6], [2, 6]],
  date: "10.03.2026",
};

export const withdrawnMatch: MatchRowProps = {
  player1: maxMustermann,
  player2: annaSchmidt,
  status: "withdrawn",
  date: "08.03.2026",
};

export const forfeitedMatch: MatchRowProps = {
  player1: maxMustermann,
  player2: annaSchmidt,
  status: "forfeited",
  date: "05.03.2026",
};

// ── Full match list (page-level) ───────────────

export const matchList: (MatchRowProps & { id: string })[] = [
  {
    id: "m1",
    player1: maxBraun,
    player2: lisaMueller,
    status: "challenged",
    date: "Offen seit 03.02.2026",
  },
  {
    id: "m2",
    player1: tomWeber,
    player2: annaSchmidt,
    status: "date_set",
    date: "15.02.2026, 18:00",
  },
  {
    id: "m3",
    player1: juliaFischer,
    player2: annaSchmidt,
    status: "completed",
    winnerId: "player1",
    scores: [[6, 3], [7, 5]],
    date: "10.02.2026",
  },
  {
    id: "m4",
    player1: maxBraun,
    player2: sophieHoffmann,
    status: "completed",
    winnerId: "player2",
    scores: [[4, 6], [3, 6]],
    date: "05.02.2026",
  },
  {
    id: "m5",
    player1: felixWagner,
    player2: paulBecker,
    status: "withdrawn",
    date: "01.02.2026",
  },
  {
    id: "m6",
    player1: marieKoch,
    player2: lauraRichter,
    status: "forfeited",
    date: "28.01.2026",
  },
  {
    id: "m7",
    player1: maxBraun,
    player2: tomWeber,
    status: "completed",
    winnerId: "player1",
    scores: [[6, 4], [6, 2]],
    date: "20.01.2026",
  },
  {
    id: "m8",
    player1: lukasSchaefer,
    player2: emmaBauer,
    status: "challenged",
    date: "Offen seit 08.02.2026",
  },
];

// ── Score fixtures ─────────────────────────────

export const emptyThreeSets: SetScore[] = [
  { player1: "", player2: "" },
  { player1: "", player2: "" },
  { player1: "", player2: "" },
];

export const emptyOneSet: SetScore[] = [
  { player1: "", player2: "" },
];

export const partiallyFilledSets: SetScore[] = [
  { player1: "6", player2: "4" },
  { player1: "3", player2: "6" },
  { player1: "", player2: "" },
];

export const completedSets: SetScore[] = [
  { player1: "6", player2: "4" },
  { player1: "3", player2: "6" },
  { player1: "7", player2: "5" },
];

export const invalidSets: SetScore[] = [
  { player1: "6", player2: "6" },
];
