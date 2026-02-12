"use client";

import preview from "#.storybook/preview";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  BoltIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { StatBlock } from "@/components/stat-block";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubJoinCard } from "@/components/domain/club-join-card";
import { QRCode } from "@/components/qr-code";
import { Avatar } from "@/components/ui/avatar";

const meta = preview.meta({
  title: "Pages/ClubDashboard",
  parameters: {
    layout: "fullscreen",
    a11y: { config: { rules: [{ id: "heading-order", enabled: false }, { id: "color-contrast", enabled: false }] } },
  },
});

export default meta;

const overdueMatches = [
  {
    id: "od1",
    player1: "Felix Wagner",
    player2: "Paul Becker",
    days: 14,
  },
  {
    id: "od2",
    player1: "Marie Koch",
    player2: "Lukas Schäfer",
    days: 10,
  },
];

function ClubDashboardPage({ showOverdue = false }: { showOverdue?: boolean }) {
  return (
    <PageWrapper activeHref="/admin/club/1" isAdmin>
      <PageLayout title="Club verwalten" subtitle="TC Musterstadt">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="mt-0">
              <StatBlock label="Spieler" value={24} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="mt-0">
              <StatBlock label="Saisons" value={3} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="mt-0">
              <StatBlock label="Offene Spiele" value={12} />
            </CardContent>
          </Card>
        </div>

        {/* Active seasons */}
        <Card>
          <CardHeader>
            <CardTitle>Aktive Saisons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Sommer 2026", players: 24, matches: 47 },
                { name: "Doppel Sommer 2026", players: 16, matches: 12 },
              ].map((season) => (
                <div
                  key={season.name}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {season.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {season.players} Spieler · {season.matches} Spiele
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Verwalten
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overdue matches */}
        {showOverdue && (
          <Card>
            <CardHeader>
              <CardTitle>Überfällige Spiele</CardTitle>
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
                      <ExclamationTriangleIcon className="size-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {m.player1} vs {m.player2}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {m.days} Tage überfällig
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        Erinnern
                      </Button>
                      <Button variant="ghost" size="sm">
                        Lösen
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
            <CardTitle>Aktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { icon: <UserGroupIcon className="size-5" />, label: "Mitglieder verwalten" },
                { icon: <CalendarDaysIcon className="size-5" />, label: "Saison erstellen" },
                { icon: <MegaphoneIcon className="size-5" />, label: "Ankündigung senden" },
                { icon: <Cog6ToothIcon className="size-5" />, label: "Club-Einstellungen" },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="justify-start"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invite section */}
        <ClubJoinCard
          mode="admin"
          clubCode="TCMS-2026"
          onCopy={() => {}}
          onShare={() => {}}
          qrSlot={
            <QRCode
              value="https://pyramid.example.com/join/TCMS-2026"
              size="md"
              label="Zum Beitreten scannen"
            />
          }
        />
      </PageLayout>
    </PageWrapper>
  );
}

export const Default = meta.story({
  render: () => <ClubDashboardPage />,
});

export const WithOverdueMatches = meta.story({
  render: () => <ClubDashboardPage showOverdue />,
});
