"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { useTranslations } from "next-intl";
import { TrophyIcon, BoltIcon } from "@heroicons/react/24/outline";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { SeasonSelector } from "@/components/domain/season-selector";
import { Tabs } from "@/components/ui/tabs";
import { PyramidGrid } from "@/components/domain/pyramid-grid";
import { StandingsTable } from "@/components/domain/standings-table";
import { DataList } from "@/components/data-list";
import { MatchRow } from "@/components/domain/match-row";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  pyramidPlayers,
  standingsPlayers,
  pyramidPlayersHistorical,
  standingsPlayersHistorical,
  bigPyramidPlayers,
  bigStandingsPlayers,
  matches,
  seasons,
} from "./_mock-data";

const meta = preview.meta({
  title: "Pages/Rankings",
  parameters: {
    layout: "fullscreen",
    a11y: {
      config: {
        rules: [
          { id: "heading-order", enabled: false },
          { id: "color-contrast", enabled: false },
        ],
      },
    },
  },
});

export default meta;

const myMatches = matches.filter(
  (m) => m.player1.name === "Max Braun" || m.player2.name === "Max Braun",
);
const openMatches = matches.filter(
  (m) => m.status === "challenged" || m.status === "date_set",
);

function getPosition(index: number, total: number) {
  if (total === 1) return "only" as const;
  if (index === 0) return "first" as const;
  if (index === total - 1) return "last" as const;
  return "middle" as const;
}

function MatchList({
  items,
  loading = false,
  selectedMatchId,
  onMatchClick,
}: {
  items: typeof matches;
  loading?: boolean;
  selectedMatchId?: string | null;
  onMatchClick?: (id: string) => void;
}) {
  const t = useTranslations("ranking");
  return (
    <DataList
      items={items}
      loading={loading}
      loadingCount={4}
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
          selected={m.id === selectedMatchId}
          position={getPosition(index, items.length)}
          onClick={() => onMatchClick?.(m.id)}
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

function RankingLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="mx-auto h-12 w-40" />
      <div className="flex justify-center gap-2">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-40" />
      </div>
      <div className="flex justify-center gap-2">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-40" />
      </div>
    </div>
  );
}

function RankingsPage({
  defaultRankingTab = 0,
  loading = false,
  empty = false,
  initialSelectedMatchId,
  customPyramid,
  customStandings,
}: {
  defaultRankingTab?: number;
  loading?: boolean;
  empty?: boolean;
  initialSelectedMatchId?: string | null;
  customPyramid?: typeof pyramidPlayers;
  customStandings?: typeof standingsPlayers;
}) {
  const t = useTranslations("ranking");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(
    initialSelectedMatchId ?? null,
  );

  const handleMatchClick = (id: string) => {
    setSelectedMatchId((prev) => (prev === id ? null : id));
  };

  const basePyramid = customPyramid ?? pyramidPlayers;
  const baseStandings = customStandings ?? standingsPlayers;
  const isHistorical = selectedMatchId !== null;
  const activePyramid = isHistorical ? pyramidPlayersHistorical : basePyramid;
  const activeStandings = isHistorical
    ? standingsPlayersHistorical
    : baseStandings;

  const selectedMatch = selectedMatchId
    ? matches.find((m) => m.id === selectedMatchId)
    : null;

  const subtitle = selectedMatch
    ? t("stateAfter", {
        player1: selectedMatch.player1.name,
        player2: selectedMatch.player2.name,
      })
    : t("seasonSubtitle", { year: "2026", club: "TC Musterstadt" });

  return (
    <PageWrapper activeHref="/club/tc-musterstadt/season/sommer-2026/rankings">
      <PageLayout
        title={t("title")}
        subtitle={subtitle}
        action={
          <SeasonSelector seasons={seasons} value="s1" onChange={() => {}} />
        }
      >
        {loading ? (
          <>
            <RankingLoadingSkeleton />
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("matches")}
              </h2>
              <MatchList items={[]} loading />
            </div>
          </>
        ) : empty ? (
          <EmptyState
            icon={<TrophyIcon />}
            title={t("noPlayers")}
            description={t("noPlayersDesc")}
          />
        ) : (
          <>
            <Tabs
              defaultIndex={defaultRankingTab}
              items={[
                {
                  label: t("pyramid"),
                  content: (
                    <PyramidGrid
                      players={activePyramid}
                      onPlayerClick={() => {}}
                    />
                  ),
                },
                {
                  label: t("list"),
                  content: (
                    <StandingsTable
                      players={activeStandings}
                      onPlayerClick={() => {}}
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
                        selectedMatchId={selectedMatchId}
                        onMatchClick={handleMatchClick}
                      />
                    ),
                  },
                  {
                    label: t("open"),
                    content: (
                      <MatchList
                        items={openMatches}
                        selectedMatchId={selectedMatchId}
                        onMatchClick={handleMatchClick}
                      />
                    ),
                  },
                  {
                    label: t("mine"),
                    content: (
                      <MatchList
                        items={myMatches}
                        selectedMatchId={selectedMatchId}
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
    </PageWrapper>
  );
}

export const Default = meta.story({
  render: () => <RankingsPage />,
});

export const ListView = meta.story({
  render: () => <RankingsPage defaultRankingTab={1} />,
});

export const MatchSelected = meta.story({
  render: () => <RankingsPage initialSelectedMatchId="m3" />,
});

export const Loading = meta.story({
  render: () => <RankingsPage loading />,
});

export const Empty = meta.story({
  render: () => <RankingsPage empty />,
});

export const BigPyramid = meta.story({
  render: () => (
    <RankingsPage
      customPyramid={bigPyramidPlayers}
      customStandings={bigStandingsPlayers}
    />
  ),
});
