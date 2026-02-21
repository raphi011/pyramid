"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
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
import { Toast } from "@/components/ui/toast";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { isActionError } from "@/app/lib/action-result";
import type { ActionResult, ActionResultWith } from "@/app/lib/action-result";
import type { SeasonDetail, SeasonStatus } from "@/app/lib/db/admin";
import { routes } from "@/app/lib/routes";

type SeasonManagementViewProps = {
  season: SeasonDetail;
  playerCount: number;
  optedOutCount: number;
  clubId: number;
  clubSlug: string;
  seasonSlug: string;
  inviteCode: string;
  appUrl: string;
  updateAction?: (
    formData: FormData,
  ) => Promise<ActionResultWith<{ slug: string }>>;
  startAction?: (formData: FormData) => Promise<ActionResult>;
  endAction?: (formData: FormData) => Promise<ActionResult>;
};

function InviteLinkCard({
  inviteCode,
  appUrl,
}: {
  inviteCode: string;
  appUrl: string;
}) {
  const t = useTranslations("seasonManagement");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const inviteUrl = `${appUrl}/season/join?code=${inviteCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, focus, mobile Safari)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("inviteLink")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            {t("inviteLinkDesc")}
          </p>
          <div className="mb-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
            <p className="break-all font-mono text-sm text-slate-700 dark:text-slate-300">
              {inviteUrl}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <ClipboardDocumentCheckIcon className="size-4" />
              ) : (
                <ClipboardIcon className="size-4" />
              )}
              {copied ? t("linkCopied") : t("copyLink")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
              <QrCodeIcon className="size-4" />
              {t("showQrCode")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title={t("qrCodeTitle")}
      >
        <div className="flex justify-center p-6">
          <QRCodeSVG value={inviteUrl} size={256} />
        </div>
      </ResponsiveDialog>
    </>
  );
}

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
  clubId,
  clubSlug,
  seasonSlug,
  inviteCode,
  appUrl,
  updateAction,
  startAction,
  endAction,
}: SeasonManagementViewProps) {
  const t = useTranslations("seasonManagement");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const tError = useTranslations();

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

  const router = useRouter();

  function buildFormData(extraFields?: Record<string, string>) {
    const fd = new FormData();
    fd.set("seasonId", season.id.toString());
    fd.set("clubId", clubId.toString());
    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        fd.set(key, value);
      }
    }
    return fd;
  }

  function runAction(
    action: ((formData: FormData) => Promise<ActionResult>) | undefined,
    extraFields?: Record<string, string>,
  ) {
    if (!action) return;
    const fd = buildFormData(extraFields);
    startTransition(async () => {
      const result = await action(fd);
      if (isActionError(result)) {
        setError(tError(result.error));
      }
    });
  }

  function handleSave() {
    if (!updateAction) return;
    const fd = buildFormData({
      name,
      bestOf,
      matchDeadlineDays,
      reminderDays,
      requiresConfirmation: requiresConfirmation.toString(),
      openEnrollment: openEnrollment.toString(),
    });
    startTransition(async () => {
      const result = await updateAction(fd);
      if (isActionError(result)) {
        setError(tError(result.error));
      } else if (result.slug !== seasonSlug) {
        router.replace(routes.admin.season(clubSlug, result.slug));
      }
    });
  }

  function handleStart() {
    runAction(startAction);
  }

  function handleEnd() {
    runAction(endAction);
  }

  return (
    <PageLayout
      title={season.name}
      subtitle={t("subtitle")}
      action={
        <Link href={routes.admin.club(clubSlug)}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="size-4" />
            {t("back")}
          </Button>
        </Link>
      }
    >
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant[season.status]}>
          {t(statusKey[season.status])}
        </Badge>
      </div>

      {/* Invite Link */}
      {season.status === "active" && openEnrollment && inviteCode && (
        <InviteLinkCard inviteCode={inviteCode} appUrl={appUrl} />
      )}

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
              <option value="1">{t("bestOf1")}</option>
              <option value="3">{t("bestOf3")}</option>
              <option value="5">{t("bestOf5")}</option>
              <option value="7">{t("bestOf7")}</option>
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
            {!isEnded && (
              <Button
                onClick={handleSave}
                disabled={pending || !updateAction}
                loading={pending}
              >
                {t("saveChanges")}
              </Button>
            )}
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
            <Link href={routes.admin.teams(clubSlug, seasonSlug)}>
              <Button variant="outline">
                {t("manageTeams")}
                <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
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
                <Button
                  onClick={handleStart}
                  disabled={pending || !startAction}
                  loading={pending}
                >
                  {t("startSeason")}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleEnd}
                  disabled={pending || !endAction}
                  loading={pending}
                >
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
          <Link href={routes.admin.seasonNew(clubSlug)}>
            <Button variant="outline">
              {t("createFromThis")}
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
      {error && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <Toast variant="error" title={error} onClose={() => setError(null)} />
        </div>
      )}
    </PageLayout>
  );
}
