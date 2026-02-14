"use client";

import preview from "#.storybook/preview";
import { BoltIcon } from "@heroicons/react/24/outline";
import { PageWrapper } from "./_page-wrapper";
import { PageLayout } from "@/components/page-layout";
import { PlayerProfile } from "@/components/domain/player-profile";
import { RankChart } from "@/components/domain/rank-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Tabs } from "@/components/ui/tabs";
import { DataList } from "@/components/data-list";
import { MatchRow } from "@/components/domain/match-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentPlayer, matches, rankChartData } from "./_mock-data";

const meta = preview.meta({
  title: "Pages/Profile",
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

const playerMatches = matches.filter(
  (m) => m.player1.name === "Max Braun" || m.player2.name === "Max Braun",
);

function ProfilePage({ unavailable = false }: { unavailable?: boolean }) {
  return (
    <PageWrapper activeHref="/profile">
      <PageLayout title="Profil">
        <PlayerProfile
          name={currentPlayer.name}
          rank={currentPlayer.rank}
          wins={currentPlayer.wins}
          losses={currentPlayer.losses}
          totalMatches={currentPlayer.totalMatches}
          winRate={currentPlayer.winRate}
          trend="up"
          trendValue="+2"
          unavailable={unavailable}
          isOwnProfile
          onEdit={() => {}}
          rankChartSlot={
            <Card>
              <CardHeader>
                <CardTitle>Rangverlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <RankChart data={rankChartData} />
              </CardContent>
            </Card>
          }
        />

        <Tabs
          items={[
            { label: "Saison", content: <StatsContent /> },
            { label: "Verein", content: <StatsContent /> },
            { label: "Gesamt", content: <StatsContent /> },
          ]}
        />

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Verfügbarkeit</CardTitle>
          </CardHeader>
          <CardContent>
            {unavailable ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Abwesend
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bis 15.03.2026
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Verfügbar melden
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-court-500" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Verfügbar
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Abwesend melden
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match history */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Spiele</CardTitle>
          </CardHeader>
          <CardContent>
            <DataList
              items={playerMatches}
              keyExtractor={(m) => m.id}
              className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden"
              renderItem={(m, index) => (
                <MatchRow
                  player1={m.player1}
                  player2={m.player2}
                  status={m.status}
                  winnerId={m.winnerId}
                  scores={m.scores}
                  date={m.date}
                  position={
                    playerMatches.length === 1
                      ? "only"
                      : index === 0
                        ? "first"
                        : index === playerMatches.length - 1
                          ? "last"
                          : "middle"
                  }
                  onClick={() => {}}
                />
              )}
              empty={{
                icon: <BoltIcon />,
                title: "Keine Spiele",
                description: "Noch keine Spiele gespielt.",
              }}
            />
          </CardContent>
        </Card>

        {/* Clubs + logout */}
        <Card>
          <CardHeader>
            <CardTitle>Vereine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    TC Musterstadt
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rang 5 · Sommer 2026
                  </p>
                </div>
                <Badge variant="win" size="sm">
                  Aktiv
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    SC Grünwald
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rang 3 · Sommer 2026
                  </p>
                </div>
                <Badge variant="win" size="sm">
                  Aktiv
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full">
          Abmelden
        </Button>
      </PageLayout>
    </PageWrapper>
  );
}

function StatsContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilanz</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              7
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Siege</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              6
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Niederlagen
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              54%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Siegquote
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const Default = meta.story({
  render: () => <ProfilePage />,
});

export const Unavailable = meta.story({
  render: () => <ProfilePage unavailable />,
});
