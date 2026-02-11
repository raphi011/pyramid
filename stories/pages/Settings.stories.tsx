"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { currentPlayer } from "./_mock-data";

const meta: Meta = {
  title: "Pages/Settings",
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj;

function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
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
              <Switch
                label="Dunkler Modus"
                checked={darkMode}
                onChange={setDarkMode}
              />
              <FormField label="Sprache" type="select" value="de">
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
                label="Ergebnisse per E-Mail"
                checked={emailResults}
                onChange={setEmailResults}
              />
              <Switch
                label="Forderungen per E-Mail"
                checked={emailChallenges}
                onChange={setEmailChallenges}
              />
              <Switch
                label="Erinnerungen per E-Mail"
                checked={emailReminders}
                onChange={setEmailReminders}
              />
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

export const Default: Story = {
  render: () => <SettingsPage />,
};
