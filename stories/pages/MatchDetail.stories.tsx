"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MatchScoreInput, type SetScore } from "@/components/domain/match-score-input";
import { FormField } from "@/components/form-field";

const meta = preview.meta({
  title: "Pages/MatchDetail",
  parameters: {
    layout: "fullscreen",
    a11y: { config: { rules: [{ id: "heading-order", enabled: false }, { id: "color-contrast", enabled: false }] } },
  },
});

export default meta;

function MatchHeader({
  status,
  date,
}: {
  status: "challenged" | "date_set" | "completed";
  date: string;
}) {
  const statusMap = {
    challenged: { label: "Offen", variant: "pending" as const },
    date_set: { label: "Geplant", variant: "info" as const },
    completed: { label: "Beendet", variant: "win" as const },
  };
  const { label, variant } = statusMap[status];

  return (
    <Card>
      <CardContent className="mt-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name="Max Braun" size="lg" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Max Braun
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rang 5
              </p>
            </div>
          </div>

          <span className="text-lg font-bold text-slate-300 dark:text-slate-600">
            vs
          </span>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Lisa Müller
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rang 4
              </p>
            </div>
            <Avatar name="Lisa Müller" size="lg" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{date}</p>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ChallengedPage() {
  const [comment, setComment] = useState("");

  return (
    <PageWrapper activeHref="/rankings">
      <PageLayout title="Spiel Details">
        <MatchHeader status="challenged" date="Offen seit 03.02.2026" />

        {/* Date proposals */}
        <Card>
          <CardHeader>
            <CardTitle>Terminvorschläge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Sa, 15.02. · 10:00", "So, 16.02. · 14:00", "Di, 18.02. · 18:00"].map((d) => (
                <div key={d} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{d}</p>
                  <div className="flex gap-1">
                    <Button size="sm">Annehmen</Button>
                    <Button variant="ghost" size="sm">Ablehnen</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Nachrichten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Avatar name="Max Braun" size="sm" />
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Wann passt es dir am besten?
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Vor 2 Stunden</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Avatar name="Lisa Müller" size="sm" />
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Samstag Vormittag wäre super!
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Vor 1 Stunde</p>
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex gap-2">
              <FormField
                label=""
                placeholder="Nachricht schreiben..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1"
              />
              <Button size="md" disabled={!comment.trim()}>
                Senden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            Zurückziehen
          </Button>
        </div>
      </PageLayout>
    </PageWrapper>
  );
}

function DateSetPage() {
  return (
    <PageWrapper activeHref="/rankings">
      <PageLayout title="Spiel Details">
        <MatchHeader status="date_set" date="15.02.2026, 10:00" />

        <Card>
          <CardHeader>
            <CardTitle>Termin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Samstag, 15. Februar 2026
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  10:00 Uhr · TC Musterstadt
                </p>
              </div>
              <Badge variant="info">Bestätigt</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button className="flex-1">Ergebnis eintragen</Button>
          <Button variant="outline" className="flex-1">
            Aufgeben
          </Button>
        </div>
      </PageLayout>
    </PageWrapper>
  );
}

function CompletedPage() {
  const completedSets: SetScore[] = [
    { player1: "6", player2: "3" },
    { player1: "7", player2: "5" },
  ];

  return (
    <PageWrapper activeHref="/rankings">
      <PageLayout title="Spiel Details">
        <MatchHeader status="completed" date="10.02.2026" />

        <Card>
          <CardHeader>
            <CardTitle>Ergebnis</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchScoreInput
              sets={completedSets}
              onChange={() => {}}
              readOnly
              player1Name="Max Braun"
              player2Name="Lisa Müller"
            />
            <div className="mt-3 text-center">
              <Badge variant="win">Max Braun gewinnt</Badge>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    </PageWrapper>
  );
}

export const Challenged = meta.story({
  render: () => <ChallengedPage />,
});

export const DateSet = meta.story({
  render: () => <DateSetPage />,
});

export const Completed = meta.story({
  render: () => <CompletedPage />,
});
