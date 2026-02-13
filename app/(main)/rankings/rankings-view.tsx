"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { Tabs } from "@/components/tabs";
import { PyramidGrid, type PyramidPlayer } from "@/components/domain/pyramid-grid";
import {
  StandingsTable,
  type StandingsPlayer,
} from "@/components/domain/standings-table";
import { SeasonSelector } from "@/components/domain/season-selector";
import { EmptyState } from "@/components/empty-state";

type RankingsViewProps = {
  seasons: { id: number; name: string }[];
  currentSeasonId: number | null;
  clubName: string;
  pyramidPlayers: PyramidPlayer[];
  standingsPlayers: StandingsPlayer[];
};

export function RankingsView({
  seasons,
  currentSeasonId,
  clubName,
  pyramidPlayers,
  standingsPlayers,
}: RankingsViewProps) {
  const t = useTranslations("ranking");
  const router = useRouter();

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
    <PageLayout title={t("title")} subtitle={subtitle} action={seasonAction}>
      {!hasPlayers ? (
        emptyState
      ) : (
        <Tabs
          items={[
            {
              label: t("pyramid"),
              content: <PyramidGrid players={pyramidPlayers} />,
            },
            {
              label: t("list"),
              content: <StandingsTable players={standingsPlayers} />,
            },
          ]}
        />
      )}
    </PageLayout>
  );
}
