"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Tabs } from "@/components/ui/tabs";
import { DataList } from "@/components/data-list";
import { MatchCard } from "@/components/domain/match-card";
import { SeasonSelector } from "@/components/domain/season-selector";
import type { MatchStatus } from "@/app/lib/db/match";

// ── Types ──────────────────────────────────────────────

type SerializedMatch = {
  id: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  status: MatchStatus;
  team1Score: number[] | null;
  team2Score: number[] | null;
  created: string; // ISO string
};

type MatchesViewProps = {
  seasons: { id: number; name: string }[];
  currentSeasonId: number | null;
  matches: SerializedMatch[];
  currentTeamId: number | null;
};

// ── Open statuses ──────────────────────────────────────

const OPEN_STATUSES: MatchStatus[] = [
  "challenged",
  "date_set",
  "pending_confirmation",
  "disputed",
];

// ── Component ──────────────────────────────────────────

export function MatchesView({
  seasons,
  currentSeasonId,
  matches,
  currentTeamId,
}: MatchesViewProps) {
  const t = useTranslations("matches");
  const router = useRouter();

  const seasonAction =
    seasons.length > 1 ? (
      <SeasonSelector
        seasons={seasons}
        value={currentSeasonId ?? undefined}
        onChange={(id) => router.push(`/matches?season=${id}`)}
      />
    ) : null;

  // Filtered match lists
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

  // Shared render function for DataList
  function renderMatch(match: SerializedMatch) {
    return (
      <MatchCard
        team1Name={match.team1Name}
        team2Name={match.team2Name}
        status={match.status}
        team1Score={match.team1Score}
        team2Score={match.team2Score}
        created={new Date(match.created)}
        isInvolved={
          currentTeamId !== null &&
          (match.team1Id === currentTeamId || match.team2Id === currentTeamId)
        }
      />
    );
  }

  return (
    <PageLayout title={t("title")} action={seasonAction}>
      <Tabs
        items={[
          {
            label: t("tabMy"),
            content: (
              <DataList
                items={myMatches}
                empty={{
                  icon: <CalendarDaysIcon />,
                  title: t("noMyMatches"),
                  description: t("noMyMatchesDesc"),
                }}
                renderItem={renderMatch}
                keyExtractor={(m) => m.id}
              />
            ),
          },
          {
            label: t("tabAll"),
            content: (
              <DataList
                items={matches}
                empty={{
                  icon: <CalendarDaysIcon />,
                  title: t("noMatches"),
                  description: t("noMatchesDesc"),
                }}
                renderItem={renderMatch}
                keyExtractor={(m) => m.id}
              />
            ),
          },
          {
            label: t("tabOpen"),
            content: (
              <DataList
                items={openMatches}
                empty={{
                  icon: <CalendarDaysIcon />,
                  title: t("noOpenMatches"),
                  description: t("noOpenMatchesDesc"),
                }}
                renderItem={renderMatch}
                keyExtractor={(m) => m.id}
              />
            ),
          },
        ]}
      />
    </PageLayout>
  );
}
