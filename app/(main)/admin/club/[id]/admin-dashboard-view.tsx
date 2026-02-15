"use client";

import { useTranslations } from "next-intl";
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
import { ClubJoinCard } from "@/components/domain/club-join-card";
import { QRCode } from "@/components/qr-code";
import type {
  ClubStats,
  AdminSeasonSummary,
  OverdueMatch,
} from "@/app/lib/db/admin";

type AdminDashboardViewProps = {
  clubName: string;
  inviteCode: string;
  stats: ClubStats;
  seasons: AdminSeasonSummary[];
  overdueMatches: OverdueMatch[];
};

export function AdminDashboardView({
  clubName,
  inviteCode,
  stats,
  seasons,
  overdueMatches,
}: AdminDashboardViewProps) {
  const t = useTranslations("adminDashboard");

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <PageLayout title={t("title")} subtitle={clubName}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="mt-0">
            <StatBlock label={t("players")} value={stats.playerCount} />
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
          {seasons.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("noActiveSeasonsDesc")}
            </p>
          ) : (
            <div className="space-y-3">
              {seasons.map((season) => (
                <div
                  key={season.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {season.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {t("playerCount", { count: season.playerCount })}
                      </span>
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
                  <Button variant="outline" size="sm" disabled>
                    {t("manage")}
                  </Button>
                </div>
              ))}
            </div>
          )}
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
            <div className="space-y-2">
              {overdueMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 dark:bg-red-950/30"
                >
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="size-4 shrink-0 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {m.player1Name} vs {m.player2Name}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {t("daysOverdue", { days: m.daysSinceCreated })}
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
              ))}
            </div>
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
            <Button variant="outline" className="justify-start" disabled>
              <UserGroupIcon className="size-5" />
              {t("manageMembers")}
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <CalendarDaysIcon className="size-5" />
              {t("createSeason")}
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <MegaphoneIcon className="size-5" />
              {t("sendAnnouncement")}
            </Button>
            <Button variant="outline" className="justify-start" disabled>
              <Cog6ToothIcon className="size-5" />
              {t("clubSettings")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invite section */}
      <ClubJoinCard
        mode="admin"
        clubCode={inviteCode}
        onCopy={() => navigator.clipboard.writeText(inviteCode)}
        qrSlot={
          appUrl ? (
            <QRCode value={`${appUrl}/join?code=${inviteCode}`} size="md" />
          ) : undefined
        }
      />
    </PageLayout>
  );
}
