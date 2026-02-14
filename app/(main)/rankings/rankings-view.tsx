"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { TrophyIcon, BoltIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Tabs } from "@/components/ui/tabs";
import { DataList } from "@/components/data-list";
import {
  PyramidGrid,
  type PyramidPlayer,
} from "@/components/domain/pyramid-grid";
import {
  StandingsTable,
  type StandingsPlayer,
} from "@/components/domain/standings-table";
import {
  MatchRow,
  type MatchStatus as MatchRowStatus,
} from "@/components/domain/match-row";
import { SeasonSelector } from "@/components/domain/season-selector";
import { EmptyState } from "@/components/empty-state";
import {
  ChallengeSheet,
  type Opponent,
} from "@/components/domain/challenge-sheet";

// ── Match types ─────────────────────────────────

type SerializedMatch = {
  id: number;
  team1Id: number;
  team2Id: number;
  player1: { name: string };
  player2: { name: string };
  status: MatchRowStatus;
  winnerId?: "player1" | "player2";
  scores?: [number, number][];
  date: string;
};

const OPEN_STATUSES: MatchRowStatus[] = [
  "challenged",
  "date_set",
  "pending_confirmation",
  "disputed",
];

function getPosition(index: number, total: number) {
  if (total === 1) return "only" as const;
  if (index === 0) return "first" as const;
  if (index === total - 1) return "last" as const;
  return "middle" as const;
}

function MatchList({
  items,
  onMatchClick,
}: {
  items: SerializedMatch[];
  onMatchClick: (id: number) => void;
}) {
  const t = useTranslations("ranking");
  return (
    <DataList
      items={items}
      keyExtractor={(m) => m.id}
      className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden"
      renderItem={(m, index) => (
        <MatchRow
          player1={m.player1}
          player2={m.player2}
          status={m.status}
          winnerId={m.winnerId}
          scores={m.scores}
          date={m.date}
          position={getPosition(index, items.length)}
          onClick={() => onMatchClick(m.id)}
        />
      )}
      empty={{
        icon: <BoltIcon />,
        title: t("noMatches"),
        description: t("noMatchesDesc"),
      }}
    />
  );
}

// ── Props ───────────────────────────────────────

type RankingsViewProps = {
  seasons: { id: number; name: string }[];
  currentSeasonId: number | null;
  clubName: string;
  pyramidPlayers: PyramidPlayer[];
  standingsPlayers: StandingsPlayer[];
  currentPlayerTeamId: number | null;
  hasOpenChallenge: boolean;
  matches: SerializedMatch[];
  currentTeamId: number | null;
};

export function RankingsView({
  seasons,
  currentSeasonId,
  clubName,
  pyramidPlayers,
  standingsPlayers,
  currentPlayerTeamId,
  hasOpenChallenge,
  matches,
  currentTeamId,
}: RankingsViewProps) {
  const t = useTranslations("ranking");
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeFromUrl = searchParams.get("challenge") === "true";
  const [challengeOpen, setChallengeOpen] = useState(challengeFromUrl);
  const [challengeTarget, setChallengeTarget] = useState<Opponent | null>(null);

  // Clean the ?challenge=true URL param after initial render
  useEffect(() => {
    if (challengeFromUrl) {
      window.history.replaceState(
        null,
        "",
        "/rankings" + (currentSeasonId ? `?season=${currentSeasonId}` : ""),
      );
    }
  }, [challengeFromUrl, currentSeasonId]);

  const opponents: Opponent[] = pyramidPlayers
    .filter((p) => p.variant === "challengeable")
    .map((p) => ({ teamId: p.id as number, name: p.name, rank: p.rank }));

  function handlePlayerClick(player: PyramidPlayer) {
    if (player.variant === "challengeable") {
      setChallengeTarget({
        teamId: player.id as number,
        name: player.name,
        rank: player.rank,
      });
      setChallengeOpen(true);
    }
  }

  function handleStandingsPlayerClick(player: StandingsPlayer) {
    if (player.challengeable) {
      setChallengeTarget({
        teamId: player.id as number,
        name: player.name,
        rank: player.rank,
      });
      setChallengeOpen(true);
    }
  }

  const seasonAction =
    seasons.length > 1 ? (
      <SeasonSelector
        seasons={seasons}
        value={currentSeasonId ?? undefined}
        onChange={(id) => router.push(`/rankings?season=${id}`)}
      />
    ) : null;

  const currentSeason = seasons.find((s) => s.id === currentSeasonId);
  const subtitle = currentSeason
    ? `${currentSeason.name} \u2014 ${clubName}`
    : clubName;

  const myMatches = useMemo(
    () =>
      currentTeamId !== null
        ? matches.filter(
            (m) => m.team1Id === currentTeamId || m.team2Id === currentTeamId,
          )
        : [],
    [matches, currentTeamId],
  );

  const openMatches = useMemo(
    () => matches.filter((m) => OPEN_STATUSES.includes(m.status)),
    [matches],
  );

  const handleMatchClick = (id: number) => router.push(`/matches/${id}`);

  const hasPlayers = pyramidPlayers.length > 0;

  const emptyState = (
    <EmptyState
      icon={<TrophyIcon />}
      title={t("noPlayers")}
      description={t("noPlayersDesc")}
    />
  );

  return (
    <>
      <PageLayout title={t("title")} subtitle={subtitle} action={seasonAction}>
        {!hasPlayers ? (
          emptyState
        ) : (
          <>
            <Tabs
              items={[
                {
                  label: t("pyramid"),
                  content: (
                    <PyramidGrid
                      players={pyramidPlayers}
                      onPlayerClick={handlePlayerClick}
                    />
                  ),
                },
                {
                  label: t("list"),
                  content: (
                    <StandingsTable
                      players={standingsPlayers}
                      onPlayerClick={handleStandingsPlayerClick}
                    />
                  ),
                },
              ]}
            />

            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("matches")}
              </h2>
              <Tabs
                items={[
                  {
                    label: t("all"),
                    content: (
                      <MatchList
                        items={matches}
                        onMatchClick={handleMatchClick}
                      />
                    ),
                  },
                  {
                    label: t("open"),
                    content: (
                      <MatchList
                        items={openMatches}
                        onMatchClick={handleMatchClick}
                      />
                    ),
                  },
                  {
                    label: t("mine"),
                    content: (
                      <MatchList
                        items={myMatches}
                        onMatchClick={handleMatchClick}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </>
        )}
      </PageLayout>
      {currentSeasonId && (
        <ChallengeSheet
          open={challengeOpen}
          onClose={() => {
            setChallengeOpen(false);
            setChallengeTarget(null);
          }}
          target={challengeTarget}
          opponents={opponents}
          seasonId={currentSeasonId}
          seasons={seasons.length > 1 ? seasons : undefined}
        />
      )}
    </>
  );
}
