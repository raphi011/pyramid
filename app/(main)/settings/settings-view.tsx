"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useTheme } from "@/components/theme-provider";
import { updateNotificationPreferencesAction } from "@/app/lib/actions/notifications";
import { updateLanguageAction } from "@/app/lib/actions/language";
import { leaveClubAction } from "@/app/lib/actions/club";
import { isActionError } from "@/app/lib/action-result";
import type { Theme, Locale, NotificationPreferences } from "@/app/lib/db/auth";
import type { ClubRole } from "@/app/lib/db/club";

type SettingsViewProps = {
  email: string;
  phone: string;
  clubs: { id: number; name: string; role: ClubRole }[];
  notifPrefs: NotificationPreferences;
  language: Locale;
};

export function SettingsView({
  email,
  phone,
  clubs,
  notifPrefs,
  language,
}: SettingsViewProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tRoot = useTranslations();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  // ── Notification state ──────────────────────
  const [emailEnabled, setEmailEnabled] = useState(notifPrefs.emailEnabled);
  const [resultEmails, setResultEmails] = useState(notifPrefs.resultEmails);
  const [challengeEmails, setChallengeEmails] = useState(
    notifPrefs.challengeEmails,
  );
  const [reminderEmails, setReminderEmails] = useState(
    notifPrefs.reminderEmails,
  );

  function saveNotifPrefs(patch: Partial<NotificationPreferences>) {
    const next = {
      emailEnabled,
      resultEmails,
      challengeEmails,
      reminderEmails,
      ...patch,
    };
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction(next);
      if (isActionError(result)) {
        // Revert optimistic state
        setEmailEnabled(notifPrefs.emailEnabled);
        setResultEmails(notifPrefs.resultEmails);
        setChallengeEmails(notifPrefs.challengeEmails);
        setReminderEmails(notifPrefs.reminderEmails);
      }
    });
  }

  // ── Language ────────────────────────────────
  function handleLanguageChange(newLocale: Locale) {
    // Set cookie client-side for instant effect
    document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
    startTransition(async () => {
      const result = await updateLanguageAction(newLocale);
      if (isActionError(result)) {
        // Revert cookie to previous value
        document.cookie = `locale=${language};path=/;max-age=${365 * 24 * 60 * 60}`;
        return;
      }
      router.refresh();
    });
  }

  // ── Leave club ──────────────────────────────
  const [leaveClubId, setLeaveClubId] = useState<number | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveClub = clubs.find((c) => c.id === leaveClubId);

  async function handleLeaveClub() {
    if (!leaveClubId) return;
    setIsLeaving(true);
    setLeaveError(null);
    try {
      const result = await leaveClubAction(leaveClubId);
      if (isActionError(result)) {
        setLeaveError(result.error);
        setIsLeaving(false);
        return;
      }
      // On success the action revalidates/redirects — close dialog
      setLeaveClubId(null);
      setIsLeaving(false);
    } catch (e) {
      console.error("handleLeaveClub failed:", e);
      setLeaveError("settings.error.serverError");
      setIsLeaving(false);
    }
  }

  return (
    <PageLayout title={t("title")}>
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              type="select"
              label={t("themeLabel")}
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
            >
              <option value="auto">{t("themeAuto")}</option>
              <option value="light">{t("themeLight")}</option>
              <option value="dark">{t("themeDark")}</option>
            </FormField>
            <FormField
              label={t("languageLabel")}
              type="select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Locale)}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Switch
              label={t("emailNotifications")}
              checked={emailEnabled}
              onChange={(checked) => {
                setEmailEnabled(checked);
                saveNotifPrefs({ emailEnabled: checked });
              }}
            />
            <div className="space-y-4 pl-4">
              <Switch
                label={t("emailResults")}
                checked={resultEmails}
                onChange={(checked) => {
                  setResultEmails(checked);
                  saveNotifPrefs({ resultEmails: checked });
                }}
                disabled={!emailEnabled}
              />
              <Switch
                label={t("emailChallenges")}
                checked={challengeEmails}
                onChange={(checked) => {
                  setChallengeEmails(checked);
                  saveNotifPrefs({ challengeEmails: checked });
                }}
                disabled={!emailEnabled}
              />
              <Switch
                label={t("emailReminders")}
                checked={reminderEmails}
                onChange={(checked) => {
                  setReminderEmails(checked);
                  saveNotifPrefs({ reminderEmails: checked });
                }}
                disabled={!emailEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("emailLabel")}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {email}
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("phoneLabel")}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {phone || "\u2013"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clubs */}
      <Card>
        <CardHeader>
          <CardTitle>{t("clubs")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clubs.map((club, i) => (
              <div key={club.id}>
                {i > 0 && <Separator className="mb-3" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {club.name}
                    </p>
                    {club.role === "admin" && (
                      <Badge variant="subtle">{tCommon("admin")}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLeaveError(null);
                      setLeaveClubId(club.id);
                    }}
                  >
                    {t("leaveClub")}
                  </Button>
                </div>
              </div>
            ))}
            <Separator />
            <Button variant="outline" size="sm" className="w-full" href="/join">
              {t("joinClub")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave club confirmation */}
      <ConfirmDialog
        open={leaveClubId !== null}
        onClose={() => {
          setLeaveClubId(null);
          setLeaveError(null);
          setIsLeaving(false);
        }}
        onConfirm={handleLeaveClub}
        title={t("leaveClubConfirmTitle", { club: leaveClub?.name ?? "" })}
        description={t("leaveClubConfirmDesc")}
        error={leaveError ? tRoot(leaveError) : undefined}
        confirmLabel={t("leaveClub")}
        loading={isLeaving}
      />

      {/* Danger zone */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            {t("deleteAccountDesc")}
          </p>
          <Button variant="destructive" size="sm" disabled>
            {t("deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" disabled>
        {t("signOut")}
      </Button>
    </PageLayout>
  );
}
