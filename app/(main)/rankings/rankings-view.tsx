"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import {
  TrophyIcon,
  BoltIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Tabs } from "@/components/ui/tabs";
import { cn, fullName } from "@/lib/utils";
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
  empty,
}: {
  items: SerializedMatch[];
  onMatchClick: (id: number) => void;
  empty: { title: string; description: string };
}) {
  const format = useFormatter();
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
          date={format.dateTime(new Date(m.date), {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
          position={getPosition(index, items.length)}
          onClick={() => onMatchClick(m.id)}
        />
      )}
      empty={{
        icon: <BoltIcon />,
        ...empty,
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
  matches: SerializedMatch[];
  currentTeamId: number | null;
};

export function RankingsView({
  seasons,
  currentSeasonId,
  clubName,
  pyramidPlayers,
  standingsPlayers,
  matches,
  currentTeamId,
}: RankingsViewProps) {
  const t = useTranslations("ranking");
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeFromUrl = searchParams.get("challenge") === "true";
  const [challengeOpen, setChallengeOpen] = useState(challengeFromUrl);
  const [view, setView] = useState<"pyramid" | "list">("pyramid");

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
    .map((p) => ({
      teamId: p.id as number,
      firstName: p.firstName,
      lastName: p.lastName,
      rank: p.rank,
    }));

  function handleNavigateToPlayer(player: {
    id: string | number;
    playerId?: number;
  }) {
    if (player.playerId != null) {
      router.push(`/player/${player.playerId}`);
    }
    // Team seasons: team page not yet implemented (US-PROF-11)
  }

  const viewToggle = (
    <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
      {(["pyramid", "list"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          aria-label={t(v)}
          aria-pressed={view === v}
          className={cn(
            "rounded-md p-1.5 transition-all duration-150",
            view === v
              ? "bg-white text-court-600 shadow-sm dark:bg-slate-900 dark:text-court-400"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
          )}
        >
          {v === "pyramid" ? (
            <Squares2X2Icon className="size-5" />
          ) : (
            <ListBulletIcon className="size-5" />
          )}
        </button>
      ))}
    </div>
  );

  const headerAction = (
    <div className="flex items-center gap-2">
      {viewToggle}
      {seasons.length > 1 && (
        <SeasonSelector
          seasons={seasons}
          value={currentSeasonId ?? undefined}
          onChange={(id) => router.push(`/rankings?season=${id}`)}
        />
      )}
    </div>
  );

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

  function handleMatchClick(id: number) {
    router.push(`/matches/${id}`);
  }

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
      <PageLayout title={t("title")} subtitle={subtitle} action={headerAction}>
        {!hasPlayers ? (
          emptyState
        ) : (
          <>
            {view === "pyramid" ? (
              <PyramidGrid
                players={pyramidPlayers}
                onPlayerClick={handleNavigateToPlayer}
              />
            ) : (
              <StandingsTable
                players={standingsPlayers}
                onPlayerClick={handleNavigateToPlayer}
              />
            )}

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
                        empty={{
                          title: t("noMatches"),
                          description: t("noMatchesDesc"),
                        }}
                      />
                    ),
                  },
                  {
                    label: t("open"),
                    content: (
                      <MatchList
                        items={openMatches}
                        onMatchClick={handleMatchClick}
                        empty={{
                          title: t("noOpenMatches"),
                          description: t("noOpenMatchesDesc"),
                        }}
                      />
                    ),
                  },
                  {
                    label: t("mine"),
                    content: (
                      <MatchList
                        items={myMatches}
                        onMatchClick={handleMatchClick}
                        empty={{
                          title: t("noMyMatches"),
                          description: t("noMyMatchesDesc"),
                        }}
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
          onClose={() => setChallengeOpen(false)}
          target={null}
          opponents={opponents}
          seasonId={currentSeasonId}
          seasons={seasons.length > 1 ? seasons : undefined}
        />
      )}
    </>
  );
}
