"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { BoltIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { PlayerProfile } from "@/components/domain/player-profile";
import { RankChart } from "@/components/domain/rank-chart";
import { MatchCard } from "@/components/domain/match-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/data-list";
import { FormField } from "@/components/form-field";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { updateProfileAction } from "@/app/lib/actions/profile";
import type { PlayerProfile as PlayerProfileType } from "@/app/lib/db/auth";
import type { ClubMembership } from "@/app/lib/db/club";
import type { HeadToHeadRecord } from "@/app/lib/db/match";
import type { MatchStatus } from "@/app/lib/db/match";

type SerializedMatch = {
  id: number;
  team1Name: string;
  team2Name: string;
  status: MatchStatus;
  team1Score: number[] | null;
  team2Score: number[] | null;
  created: string;
};

type StatsScope = {
  wins: number;
  losses: number;
};

type SeasonStatsScope = StatsScope & {
  rank: number;
  trend: "up" | "down" | "none";
  trendValue: string;
};

type ProfileViewProps = {
  profile: PlayerProfileType;
  clubs: ClubMembership[];
  seasonStats: SeasonStatsScope;
  clubStats: StatsScope;
  allStats: StatsScope;
  rankHistory: { date: string; rank: number }[];
  recentMatches: SerializedMatch[];
  headToHead: HeadToHeadRecord[];
  seasonId: number | null;
};

function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

function ProfileView({
  profile,
  clubs,
  seasonStats,
  clubStats,
  allStats,
  rankHistory,
  recentMatches,
  headToHead,
  seasonId,
}: ProfileViewProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editError, setEditError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleEditSubmit = useCallback(
    (formData: FormData) => {
      startTransition(async () => {
        setEditError(null);
        const result = await updateProfileAction(formData);
        if ("error" in result) {
          setEditError(t(`error.${result.error.split(".").pop()}`));
        } else {
          setEditOpen(false);
          router.refresh();
        }
      });
    },
    [t, router],
  );

  const trendProp =
    seasonStats.trend === "none" ? undefined : seasonStats.trend;

  return (
    <PageLayout title={t("title")}>
      <PlayerProfile
        name={profile.name}
        rank={seasonStats.rank}
        wins={seasonStats.wins}
        losses={seasonStats.losses}
        totalMatches={seasonStats.wins + seasonStats.losses}
        winRate={winRate(seasonStats.wins, seasonStats.losses)}
        trend={trendProp}
        trendValue={seasonStats.trendValue || undefined}
        isOwnProfile
        onEdit={() => setEditOpen(true)}
        rankChartSlot={
          rankHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("rankChart")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RankChart data={rankHistory} />
              </CardContent>
            </Card>
          ) : null
        }
      />

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
          {recentMatches.length > 0 && seasonId && (
            <CardAction>
              <Link
                href="/matches"
                className="text-sm font-medium text-court-600 hover:text-court-700 dark:text-court-400"
              >
                {t("seeAllMatches")}
              </Link>
            </CardAction>
          )}
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
                onClick={() => router.push(`/matches/${m.id}`)}
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

      {/* Clubs */}
      <Card>
        <CardHeader>
          <CardTitle>{t("clubs")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clubs.map((club) => (
              <div
                key={club.clubId}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {club.clubName}
                </span>
                {club.role === "admin" && (
                  <Badge variant="info" size="sm">
                    {tCommon("admin")}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <form action="/api/auth/logout" method="POST">
        <Button type="submit" variant="outline" className="w-full">
          {tNav("logout")}
        </Button>
      </form>

      {/* Edit Profile Dialog */}
      <ResponsiveDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t("editTitle")}
      >
        <form ref={formRef} action={handleEditSubmit} className="space-y-4">
          <FormField
            label={t("nameLabel")}
            required
            inputProps={{
              name: "name",
              defaultValue: profile.name,
            }}
          />
          <FormField
            type="tel"
            label={t("phoneLabel")}
            inputProps={{
              name: "phoneNumber",
              defaultValue: profile.phoneNumber,
            }}
          />
          <FormField
            type="textarea"
            label={t("bioLabel")}
            placeholder={t("bioPlaceholder")}
            inputProps={{
              name: "bio",
              defaultValue: profile.bio,
              rows: 3,
            }}
          />

          {editError && (
            <p className="text-sm text-red-600" role="alert">
              {editError}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setEditOpen(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-court-500 text-white hover:bg-court-600"
              loading={isPending}
            >
              {tCommon("save")}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </PageLayout>
  );
}

function StatsCard({ wins, losses }: { wins: number; losses: number }) {
  const t = useTranslations("profile");
  const total = wins + losses;
  const rate = total === 0 ? "0%" : `${Math.round((wins / total) * 100)}%`;

  return (
    <Card>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {wins}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("winsLabel")}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {losses}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("lossesLabel")}
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {rate}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("winRateLabel")}
          </p>
        </div>
      </div>
    </Card>
  );
}

export { ProfileView };
