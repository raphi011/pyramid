"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { PageLayout } from "@/components/page-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";
import { Switch } from "@/components/ui/switch";
import type { SeasonDetail, SeasonStatus } from "@/app/lib/db/admin";

type SeasonManagementViewProps = {
  season: SeasonDetail;
  playerCount: number;
  optedOutCount: number;
  clubId: number;
};

const statusVariant: Record<SeasonStatus, "win" | "pending" | "subtle"> = {
  active: "win",
  draft: "pending",
  ended: "subtle",
};

const statusKey: Record<SeasonStatus, string> = {
  active: "statusActive",
  draft: "statusDraft",
  ended: "statusEnded",
};

export function SeasonManagementView({
  season,
  playerCount,
  optedOutCount,
}: SeasonManagementViewProps) {
  const t = useTranslations("seasonManagement");

  const [name, setName] = useState(season.name);
  const [bestOf, setBestOf] = useState(season.bestOf.toString());
  const [matchDeadlineDays, setMatchDeadlineDays] = useState(
    season.matchDeadlineDays.toString(),
  );
  const [reminderDays, setReminderDays] = useState(
    season.reminderDays.toString(),
  );
  const [requiresConfirmation, setRequiresConfirmation] = useState(
    season.requiresResultConfirmation,
  );
  const [openEnrollment, setOpenEnrollment] = useState(season.openEnrollment);
  const isEnded = season.status === "ended";
  const isDraft = season.status === "draft";

  return (
    <PageLayout
      title={season.name}
      subtitle={t("subtitle")}
      action={
        <Button variant="ghost" size="sm" disabled>
          <ArrowLeftIcon className="size-4" />
          {t("back")}
        </Button>
      }
    >
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant[season.status]}>
          {t(statusKey[season.status])}
        </Badge>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t("configuration")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              label={t("nameLabel")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEnded}
            />
            <FormField
              label={t("bestOfLabel")}
              type="select"
              value={bestOf}
              onChange={(e) => setBestOf(e.target.value)}
              disabled={isEnded}
            >
              <option value="1">Best of 1</option>
              <option value="3">Best of 3</option>
              <option value="5">Best of 5</option>
              <option value="7">Best of 7</option>
            </FormField>
            <FormField
              label={t("matchDeadlineLabel")}
              type="number"
              value={matchDeadlineDays}
              onChange={(e) => setMatchDeadlineDays(e.target.value)}
              disabled={isEnded}
              inputProps={{ min: 1, max: 90 }}
            />
            <FormField
              label={t("reminderLabel")}
              type="number"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              disabled={isEnded}
              inputProps={{ min: 1, max: 90 }}
            />
            <Switch
              label={t("requiresConfirmation")}
              checked={requiresConfirmation}
              onChange={setRequiresConfirmation}
              disabled={isEnded}
            />
            <Switch
              label={t("openEnrollment")}
              checked={openEnrollment}
              onChange={setOpenEnrollment}
              disabled={isEnded}
            />
            {!isEnded && <Button disabled>{t("saveChanges")}</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Standings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("standings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {!isEnded && (
              <Button variant="outline" disabled>
                {t("editRankings")}
                <ArrowRightIcon className="size-4" />
              </Button>
            )}
            <Button variant="outline" disabled>
              {t("viewPyramid")}
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader>
          <CardTitle>{t("playersSection")}</CardTitle>
          <CardAction>
            <Badge variant="info">
              {t("playerStats", {
                active: playerCount,
                optedOut: optedOutCount,
              })}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            {t("managePlayers")}
            <ArrowRightIcon className="size-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Teams (conditional) */}
      {season.isTeamSeason && (
        <Card>
          <CardHeader>
            <CardTitle>{t("teamsSection")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              {t("manageTeams")}
              <ArrowRightIcon className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Season Lifecycle */}
      {!isEnded && (
        <Card>
          <CardHeader>
            <CardTitle>{t("lifecycle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {isDraft ? (
                <Button disabled>{t("startSeason")}</Button>
              ) : (
                <Button variant="destructive" disabled>
                  {t("endSeason")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Season */}
      <Card>
        <CardHeader>
          <CardTitle>{t("newSeason")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            {t("createFromThis")}
            <ArrowRightIcon className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
