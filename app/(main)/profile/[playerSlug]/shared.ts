import type { MatchStatus } from "@/app/lib/db/match";

export type SerializedMatch = {
  id: number;
  team1Name: string;
  team2Name: string;
  status: MatchStatus;
  team1Score: number[] | null;
  team2Score: number[] | null;
  created: string;
};

export type StatsScope = {
  wins: number;
  losses: number;
};

export type SeasonStatsScope = StatsScope & {
  rank: number;
  trend: "up" | "down" | "none";
  trendValue: string;
};

export function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}
