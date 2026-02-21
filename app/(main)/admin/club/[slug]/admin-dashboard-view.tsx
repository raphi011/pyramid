"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import { StatBlock } from "@/components/stat-block";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataList } from "@/components/data-list";
import { ClubJoinCard } from "@/components/domain/club-join-card";
import { QRCode } from "@/components/qr-code";
import { routes } from "@/app/lib/routes";
import type {
  ClubStats,
  AdminSeasonSummary,
  OverdueMatch,
} from "@/app/lib/db/admin";

type AdminDashboardViewProps = {
  clubSlug: string;
  clubName: string;
  inviteCode: string;
  appUrl: string;
  stats: ClubStats;
  seasons: AdminSeasonSummary[];
  overdueMatches: OverdueMatch[];
};

export function AdminDashboardView({
  clubSlug,
  clubName,
  inviteCode,
  appUrl,
  stats,
  seasons,
  overdueMatches,
}: AdminDashboardViewProps) {
  const t = useTranslations("adminDashboard");

  return (
    <PageLayout title={t("title")} subtitle={clubName}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="mt-0">
            <StatBlock label={t("members")} value={stats.memberCount} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="mt-0">
            <StatBlock label={t("seasons")} value={stats.activeSeasonCount} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="mt-0">
            <StatBlock
              label={t("openChallenges")}
              value={stats.openChallengeCount}
            />
          </CardContent>
        </Card>
      </div>

      {/* Active seasons */}
      <Card>
        <CardHeader>
          <CardTitle>{t("activeSeasons")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataList
            items={seasons}
            keyExtractor={(s) => s.id}
            separator={false}
            empty={{
              title: t("noActiveSeasons"),
              description: t("noActiveSeasonsDesc"),
            }}
            className="space-y-3"
            renderItem={(season) => (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {season.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{t("teamCount", { count: season.teamCount })}</span>
                    <span>&middot;</span>
                    <span>
                      {t("matchCount", { count: season.openChallengeCount })}
                    </span>
                    {season.overdueMatchCount > 0 && (
                      <>
                        <span>&middot;</span>
                        <span className="text-red-600 dark:text-red-400">
                          {t("overdueCount", {
                            count: season.overdueMatchCount,
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Link href={routes.admin.season(clubSlug, season.slug)}>
                  <Button variant="outline" size="sm">
                    {t("manage")}
                  </Button>
                </Link>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Overdue matches */}
      {overdueMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("overdueMatches")}</CardTitle>
            <CardAction>
              <Badge variant="loss">{overdueMatches.length}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <DataList
              items={overdueMatches}
              keyExtractor={(m) => m.id}
              separator={false}
              className="space-y-2"
              renderItem={(m) => (
                <div className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 dark:bg-red-950/30">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="size-4 shrink-0 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {m.team1Name} vs {m.team2Name}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {t("daysOverdue", { days: m.daysOverdue })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled>
                      {t("nudge")}
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      {t("resolve")}
                    </Button>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href={routes.admin.members(clubSlug)}>
              <Button variant="outline" className="w-full justify-start">
                <UserGroupIcon className="size-5" />
                {t("manageMembers")}
              </Button>
            </Link>
            <Link href={routes.admin.seasonNew(clubSlug)}>
              <Button variant="outline" className="w-full justify-start">
                <CalendarDaysIcon className="size-5" />
                {t("createSeason")}
              </Button>
            </Link>
            <Link href={routes.admin.announcements(clubSlug)}>
              <Button variant="outline" className="w-full justify-start">
                <MegaphoneIcon className="size-5" />
                {t("sendAnnouncement")}
              </Button>
            </Link>
            <Link href={routes.admin.settings(clubSlug)}>
              <Button variant="outline" className="w-full justify-start">
                <Cog6ToothIcon className="size-5" />
                {t("clubSettings")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Invite section */}
      <ClubJoinCard
        mode="admin"
        clubCode={inviteCode}
        onCopy={() => {
          navigator.clipboard.writeText(inviteCode).catch(() => {
            // Clipboard API may fail (permissions, non-secure context)
          });
        }}
        qrSlot={
          appUrl ? (
            <QRCode
              value={`${appUrl}/join?code=${encodeURIComponent(inviteCode)}`}
              size="md"
            />
          ) : undefined
        }
      />
    </PageLayout>
  );
}
