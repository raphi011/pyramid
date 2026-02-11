"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
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
  matches,
  seasons,
} from "./_mock-data";

const meta: Meta = {
  title: "Pages/Rangliste",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

const myMatches = matches.filter(
  (m) => m.player1.name === "Max Braun" || m.player2.name === "Max Braun",
);
const openMatches = matches.filter(
  (m) => m.status === "challenged" || m.status === "date_set",
);

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
  return (
    <DataList
      items={items}
      loading={loading}
      loadingCount={4}
      keyExtractor={(m) => m.id}
      renderItem={(m) => (
        <MatchRow
          player1={m.player1}
          player2={m.player2}
          status={m.status}
          winnerId={m.winnerId}
          scores={m.scores}
          date={m.date}
          selected={m.id === selectedMatchId}
          onClick={() => onMatchClick?.(m.id)}
        />
      )}
      empty={{
        icon: <BoltIcon />,
        title: "Keine Spiele",
        description: "Fordere einen Spieler heraus, um loszulegen.",
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

function RanglistePage({
  defaultRankingTab = 0,
  loading = false,
  empty = false,
  initialSelectedMatchId,
}: {
  defaultRankingTab?: number;
  loading?: boolean;
  empty?: boolean;
  initialSelectedMatchId?: string | null;
}) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(
    initialSelectedMatchId ?? null,
  );

  const handleMatchClick = (id: string) => {
    setSelectedMatchId((prev) => (prev === id ? null : id));
  };

  const isHistorical = selectedMatchId !== null;
  const activePyramid = isHistorical ? pyramidPlayersHistorical : pyramidPlayers;
  const activeStandings = isHistorical ? standingsPlayersHistorical : standingsPlayers;

  const selectedMatch = selectedMatchId
    ? matches.find((m) => m.id === selectedMatchId)
    : null;

  const subtitle = selectedMatch
    ? `Stand nach: ${selectedMatch.player1.name} vs ${selectedMatch.player2.name}`
    : "Saison 2026 — TC Musterstadt";

  return (
    <PageWrapper activeHref="/rangliste">
      <PageLayout
        title="Rangliste"
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
                Spiele
              </h2>
              <MatchList items={[]} loading />
            </div>
          </>
        ) : empty ? (
          <EmptyState
            icon={<TrophyIcon />}
            title="Keine Spieler"
            description="Es wurden noch keine Spieler für diese Saison hinzugefügt."
          />
        ) : (
          <>
            <Tabs
              defaultIndex={defaultRankingTab}
              items={[
                {
                  label: "Pyramide",
                  content: (
                    <PyramidGrid
                      players={activePyramid}
                      onPlayerClick={() => {}}
                    />
                  ),
                },
                {
                  label: "Liste",
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
                Spiele
              </h2>
              <Tabs
                items={[
                  {
                    label: "Alle",
                    content: (
                      <MatchList
                        items={matches}
                        selectedMatchId={selectedMatchId}
                        onMatchClick={handleMatchClick}
                      />
                    ),
                  },
                  {
                    label: "Offen",
                    content: (
                      <MatchList
                        items={openMatches}
                        selectedMatchId={selectedMatchId}
                        onMatchClick={handleMatchClick}
                      />
                    ),
                  },
                  {
                    label: "Meine",
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

export const Default: Story = {
  render: () => <RanglistePage />,
};

export const ListView: Story = {
  render: () => <RanglistePage defaultRankingTab={1} />,
};

export const MatchSelected: Story = {
  render: () => <RanglistePage initialSelectedMatchId="m3" />,
};

export const Loading: Story = {
  render: () => <RanglistePage loading />,
};

export const Empty: Story = {
  render: () => <RanglistePage empty />,
};
