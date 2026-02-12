import type { PlayerRef } from "@/components/domain/event-item";
import type { PyramidPlayer } from "@/components/domain/pyramid-grid";
import type { StandingsPlayer } from "@/components/domain/standings-table";

// ── Player references (name-only) ──────────────

export const maxMustermann: PlayerRef = { name: "Max Mustermann" };
export const annaSchmidt: PlayerRef = { name: "Anna Schmidt" };
export const tomWeber: PlayerRef = { name: "Tom Weber" };
export const lisaMueller: PlayerRef = { name: "Lisa Müller" };
export const maxBraun: PlayerRef = { name: "Max Braun" };
export const sophieHoffmann: PlayerRef = { name: "Sophie Hoffmann" };
export const paulBecker: PlayerRef = { name: "Paul Becker" };
export const lauraRichter: PlayerRef = { name: "Laura Richter" };
export const felixWagner: PlayerRef = { name: "Felix Wagner" };
export const marieKoch: PlayerRef = { name: "Marie Koch" };
export const lukasSchaefer: PlayerRef = { name: "Lukas Schäfer" };
export const emmaBauer: PlayerRef = { name: "Emma Bauer" };
export const juliaFischer: PlayerRef = { name: "Julia Fischer" };
export const sarahHoffmann: PlayerRef = { name: "Sarah Hoffmann" };
export const erikMeier: PlayerRef = { name: "Erik Meier" };
export const claraBauer: PlayerRef = { name: "Clara Bauer" };
export const lukasRichter: PlayerRef = { name: "Lukas Richter" };
export const marieWagner: PlayerRef = { name: "Marie Wagner" };

// ── Ranked players ─────────────────────────────

export const rankedPlayers = [
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

// ── Current player ─────────────────────────────

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

// ── 10-player set for PyramidGrid ──────────────

export const tenPyramidPlayers: PyramidPlayer[] = [
  { id: 1, name: "Julia Fischer", rank: 1, wins: 12, losses: 0 },
  { id: 2, name: "Anna Schmidt", rank: 2, wins: 8, losses: 1 },
  { id: 3, name: "Tom Weber", rank: 3, wins: 5, losses: 2, variant: "current" },
  { id: 4, name: "Lisa Müller", rank: 4, wins: 6, losses: 3 },
  { id: 5, name: "Max Braun", rank: 5, wins: 4, losses: 4 },
  { id: 6, name: "Sarah Hoffmann", rank: 6, wins: 3, losses: 5 },
  { id: 7, name: "Erik Meier", rank: 7, wins: 2, losses: 6 },
  { id: 8, name: "Clara Bauer", rank: 8, wins: 2, losses: 3 },
  { id: 9, name: "Lukas Richter", rank: 9, wins: 1, losses: 5 },
  { id: 10, name: "Marie Wagner", rank: 10, wins: 0, losses: 7 },
];

// ── 6-player set for StandingsTable ────────────

export const sixStandingsPlayers: StandingsPlayer[] = [
  { id: 1, name: "Julia Fischer", rank: 1, wins: 12, losses: 0, movement: "up" },
  { id: 2, name: "Anna Schmidt", rank: 2, wins: 8, losses: 1, movement: "none" },
  { id: 3, name: "Tom Weber", rank: 3, wins: 5, losses: 2, movement: "down" },
  { id: 4, name: "Lisa Müller", rank: 4, wins: 6, losses: 3, movement: "up" },
  { id: 5, name: "Max Braun", rank: 5, wins: 4, losses: 4, movement: "none" },
  { id: 6, name: "Sarah Hoffmann", rank: 6, wins: 3, losses: 5, movement: "down" },
];

// ── Helpers ────────────────────────────────────

export function toPyramidPlayers(
  players: typeof rankedPlayers,
  currentId = currentPlayer.id,
): PyramidPlayer[] {
  return players.map((p) => ({
    ...p,
    variant:
      p.id === currentId
        ? ("current" as const)
        : p.rank === 3 || p.rank === 4
          ? ("challengeable" as const)
          : ("default" as const),
  }));
}

export function toStandingsPlayers(
  players: typeof rankedPlayers,
): StandingsPlayer[] {
  return players.map((p) => ({
    ...p,
    movement:
      p.rank <= 3
        ? ("up" as const)
        : p.rank >= 10
          ? ("down" as const)
          : ("none" as const),
    challengeable: p.rank === 3 || p.rank === 4,
  }));
}
