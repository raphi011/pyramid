"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Tabs } from "@/components/ui/tabs";
import {
  PyramidGrid,
  type PyramidPlayer,
} from "@/components/domain/pyramid-grid";
import {
  StandingsTable,
  type StandingsPlayer,
} from "@/components/domain/standings-table";
import { SeasonSelector } from "@/components/domain/season-selector";
import { EmptyState } from "@/components/empty-state";
import {
  ChallengeSheet,
  type Opponent,
} from "@/components/domain/challenge-sheet";

type RankingsViewProps = {
  seasons: { id: number; name: string }[];
  currentSeasonId: number | null;
  clubName: string;
  pyramidPlayers: PyramidPlayer[];
  standingsPlayers: StandingsPlayer[];
  currentPlayerTeamId: number | null;
  hasOpenChallenge: boolean;
};

export function RankingsView({
  seasons,
  currentSeasonId,
  clubName,
  pyramidPlayers,
  standingsPlayers,
  currentPlayerTeamId,
  hasOpenChallenge,
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
