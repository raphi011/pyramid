"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BoltIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { PlayerProfile } from "@/components/domain/player-profile";
import { RankChart } from "@/components/domain/rank-chart";
import { MatchCard } from "@/components/domain/match-card";
import { ChallengeSheet } from "@/components/domain/challenge-sheet";
import { fullName } from "@/lib/utils";
import { StatsCard } from "@/components/domain/stats-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Tabs } from "@/components/ui/tabs";
import { DataList } from "@/components/data-list";
import { routes } from "@/app/lib/routes";
import type { PlayerProfile as PlayerProfileType } from "@/app/lib/db/auth";
import type { HeadToHeadRecord } from "@/app/lib/db/match";
import type { SerializedMatch, StatsScope, SeasonStatsScope } from "./shared";
import { winRate } from "./shared";

type PlayerDetailViewProps = {
  profile: PlayerProfileType;
  seasonStats: SeasonStatsScope;
  clubStats: StatsScope;
  allStats: StatsScope;
  rankHistory: { date: string; rank: number; matchId: number }[];
  recentMatches: SerializedMatch[];
  headToHead: HeadToHeadRecord[];
  canChallenge: boolean;
  seasonId: number | null;
  targetTeamId: number | null;
  clubSlug: string | null;
  seasonSlug: string | null;
};

function PlayerDetailView({
  profile,
  seasonStats,
  clubStats,
  allStats,
  rankHistory,
  recentMatches,
  headToHead,
  canChallenge: canChallengePlayer,
  seasonId,
  targetTeamId,
  clubSlug,
  seasonSlug,
}: PlayerDetailViewProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [challengeOpen, setChallengeOpen] = useState(false);

  const trendProp =
    seasonStats.trend === "none" ? undefined : seasonStats.trend;

  // Build unavailability display
  const isUnavailable =
    profile.unavailableFrom &&
    profile.unavailableUntil &&
    new Date(profile.unavailableFrom) <= new Date() &&
    new Date(profile.unavailableUntil) >= new Date();

  return (
    <PageLayout title={fullName(profile.firstName, profile.lastName)}>
      <PlayerProfile
        name={fullName(profile.firstName, profile.lastName)}
        rank={seasonStats.rank}
        wins={seasonStats.wins}
        losses={seasonStats.losses}
        totalMatches={seasonStats.wins + seasonStats.losses}
        winRate={winRate(seasonStats.wins, seasonStats.losses)}
        trend={trendProp}
        trendValue={seasonStats.trendValue || undefined}
        unavailable={!!isUnavailable}
        canChallenge={canChallengePlayer}
        onChallenge={() => setChallengeOpen(true)}
        rankChartSlot={
          rankHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("rankChart")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RankChart
                  data={rankHistory}
                  emptyLabel={t("noRankData")}
                  tooltipLabel={t("rankTooltip")}
                  onDotClick={(matchId) =>
                    clubSlug && seasonSlug
                      ? router.push(routes.match(clubSlug, seasonSlug, matchId))
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          ) : null
        }
      />

      {/* Unavailability notice */}
      {isUnavailable && profile.unavailableUntil && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("unavailableUntil", {
            date: new Date(profile.unavailableUntil).toLocaleDateString(
              "de-DE",
              { day: "2-digit", month: "2-digit", year: "numeric" },
            ),
          })}
        </p>
      )}

      {/* Stats scope tabs */}
      <Tabs
        items={[
          {
            label: t("scopeSeason"),
            content: (
              <StatsCard wins={seasonStats.wins} losses={seasonStats.losses} />
            ),
          },
          {
            label: t("scopeClub"),
            content: (
              <StatsCard wins={clubStats.wins} losses={clubStats.losses} />
            ),
          },
          {
            label: t("scopeAll"),
            content: (
              <StatsCard wins={allStats.wins} losses={allStats.losses} />
            ),
          },
        ]}
      />

      {/* Match History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("matchHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataList
            items={recentMatches}
            keyExtractor={(m) => m.id}
            empty={{
              icon: <BoltIcon className="size-6" />,
              title: t("noMatches"),
              description: t("noMatchesDesc"),
            }}
            renderItem={(m) => (
              <MatchCard
                team1Name={m.team1Name}
                team2Name={m.team2Name}
                status={m.status}
                team1Score={m.team1Score}
                team2Score={m.team2Score}
                created={new Date(m.created)}
                onClick={
                  clubSlug && seasonSlug
                    ? () =>
                        router.push(routes.match(clubSlug, seasonSlug, m.id))
                    : undefined
                }
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Head-to-Head */}
      <Card>
        <CardHeader>
          <CardTitle>{t("headToHead")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataList
            items={headToHead}
            keyExtractor={(r) => r.opponentTeamId}
            empty={{
              title: t("noHeadToHead"),
              description: t("noHeadToHeadDesc"),
            }}
            renderItem={(record) => (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {record.opponentName}
                </span>
                <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
                  {t("record", {
                    wins: record.wins,
                    losses: record.losses,
                  })}
                </span>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Challenge Sheet */}
      {canChallengePlayer && seasonId && targetTeamId && (
        <ChallengeSheet
          open={challengeOpen}
          onClose={() => setChallengeOpen(false)}
          target={{
            teamId: targetTeamId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            rank: seasonStats.rank,
          }}
          opponents={[]}
          seasonId={seasonId}
        />
      )}
    </PageLayout>
  );
}

export { PlayerDetailView };
