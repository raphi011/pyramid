"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { FormField } from "@/components/form-field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/app/lib/db/auth";

type SettingsViewProps = {
  email: string;
  phone: string;
  clubs: { id: number; name: string }[];
};

export function SettingsView({ email, phone, clubs }: SettingsViewProps) {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailResults, setEmailResults] = useState(true);
  const [emailChallenges, setEmailChallenges] = useState(true);
  const [emailReminders, setEmailReminders] = useState(false);

  return (
    <PageLayout title={t("title")}>
      {/* Appearance — functional */}
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
              inputProps={{ defaultValue: "de" }}
              disabled
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Notifications — static for now */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Switch
              label={t("emailNotifications")}
              checked={emailEnabled}
              onChange={setEmailEnabled}
            />
            <div className="space-y-4 pl-4">
              <Switch
                label={t("emailResults")}
                checked={emailResults}
                onChange={setEmailResults}
                disabled={!emailEnabled}
              />
              <Switch
                label={t("emailChallenges")}
                checked={emailChallenges}
                onChange={setEmailChallenges}
                disabled={!emailEnabled}
              />
              <Switch
                label={t("emailReminders")}
                checked={emailReminders}
                onChange={setEmailReminders}
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
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {club.name}
                  </p>
                  <Button variant="ghost" size="sm" disabled>
                    {t("leaveClub")}
                  </Button>
                </div>
              </div>
            ))}
            <Separator />
            <Button variant="outline" size="sm" className="w-full" disabled>
              {t("joinClub")}
            </Button>
          </div>
        </CardContent>
      </Card>

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
