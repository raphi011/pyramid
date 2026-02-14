"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import type { Theme } from "@/app/lib/db/auth";
import { currentPlayer } from "./_mock-data";

const meta = preview.meta({
  title: "Pages/Settings",
  parameters: {
    layout: "fullscreen",
    a11y: {
      config: {
        rules: [
          { id: "heading-order", enabled: false },
          { id: "color-contrast", enabled: false },
        ],
      },
    },
  },
});

export default meta;

function ThemeSelect() {
  const { theme, setTheme } = useTheme();

  return (
    <FormField
      label="Farbschema"
      type="select"
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
    >
      <option value="auto">Automatisch</option>
      <option value="light">Hell</option>
      <option value="dark">Dunkel</option>
    </FormField>
  );
}

function SettingsPage() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailResults, setEmailResults] = useState(true);
  const [emailChallenges, setEmailChallenges] = useState(true);
  const [emailReminders, setEmailReminders] = useState(false);

  return (
    <PageWrapper activeHref="/settings">
      <PageLayout title="Einstellungen">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Darstellung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ThemeSelect />
              <FormField
                label="Sprache"
                type="select"
                inputProps={{ defaultValue: "de" }}
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
            <CardTitle>Benachrichtigungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Switch
                label="E-Mail-Benachrichtigungen"
                checked={emailEnabled}
                onChange={setEmailEnabled}
              />
              <div className="space-y-4 pl-4">
                <Switch
                  label="Ergebnisse per E-Mail"
                  checked={emailResults}
                  onChange={setEmailResults}
                  disabled={!emailEnabled}
                />
                <Switch
                  label="Forderungen per E-Mail"
                  checked={emailChallenges}
                  onChange={setEmailChallenges}
                  disabled={!emailEnabled}
                />
                <Switch
                  label="Erinnerungen per E-Mail"
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
            <CardTitle>Konto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  E-Mail
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {currentPlayer.email}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Telefon
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {currentPlayer.phone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clubs */}
        <Card>
          <CardHeader>
            <CardTitle>Vereine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  TC Musterstadt
                </p>
                <Button variant="ghost" size="sm">
                  Verlassen
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  SC Grünwald
                </p>
                <Button variant="ghost" size="sm">
                  Verlassen
                </Button>
              </div>
              <Separator />
              <Button variant="outline" size="sm" className="w-full">
                Verein beitreten
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card>
          <CardHeader>
            <CardTitle>Gefahrenzone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Dein Konto und alle Daten werden unwiderruflich gelöscht.
            </p>
            <Button variant="destructive" size="sm">
              Konto löschen
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full">
          Abmelden
        </Button>
      </PageLayout>
    </PageWrapper>
  );
}

export const Default = meta.story({
  render: function SettingsStory() {
    return (
      <ThemeProvider initialTheme="auto">
        <SettingsPage />
      </ThemeProvider>
    );
  },
});
