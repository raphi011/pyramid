"use client";

import preview from "#.storybook/preview";
import { within, expect } from "storybook/test";
import { PageWrapper } from "./_page-wrapper";
import { AdminDashboardView } from "@/app/(main)/admin/club/[slug]/admin-dashboard-view";
import type {
  ClubStats,
  AdminSeasonSummary,
  OverdueMatch,
} from "@/app/lib/db/admin";

const meta = preview.meta({
  title: "Pages/ClubDashboard",
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

const stats: ClubStats = {
  memberCount: 24,
  activeSeasonCount: 3,
  openChallengeCount: 12,
};

const seasons: AdminSeasonSummary[] = [
  {
    id: 1,
    slug: "sommer-2026",
    name: "Sommer 2026",
    teamCount: 24,
    openChallengeCount: 8,
    overdueMatchCount: 2,
  },
  {
    id: 2,
    slug: "doppel-sommer-2026",
    name: "Doppel Sommer 2026",
    teamCount: 16,
    openChallengeCount: 4,
    overdueMatchCount: 0,
  },
];

const overdueMatches: OverdueMatch[] = [
  {
    id: 1,
    seasonId: 1,
    team1Name: "Felix Wagner",
    team2Name: "Paul Becker",
    daysOverdue: 14,
  },
  {
    id: 2,
    seasonId: 1,
    team1Name: "Marie Koch",
    team2Name: "Lukas Sch\u00e4fer",
    daysOverdue: 10,
  },
];

export const Default = meta.story({
  render: function DefaultStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <AdminDashboardView
          clubSlug="tc-musterstadt"
          clubName="TC Musterstadt"
          inviteCode="TCMS-2026"
          appUrl="http://localhost:3000"
          stats={stats}
          seasons={seasons}
          overdueMatches={[]}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Stat blocks render correct values (scoped to the stats grid)
    const statsGrid = canvasElement.querySelector(".grid.grid-cols-3")!;
    const statsArea = within(statsGrid as HTMLElement);
    await expect(statsArea.getByText("24")).toBeInTheDocument();
    await expect(statsArea.getByText("3")).toBeInTheDocument();
    await expect(statsArea.getByText("12")).toBeInTheDocument();

    // Seasons are listed (scope to main to avoid sidebar nav duplicates)
    const main = within(canvasElement.querySelector("main")! as HTMLElement);
    await expect(main.getByText("Sommer 2026")).toBeInTheDocument();
    await expect(main.getByText("Doppel Sommer 2026")).toBeInTheDocument();

    // Overdue matches section should NOT be present
    await expect(canvas.queryByText(/Felix Wagner/)).not.toBeInTheDocument();
  },
});

export const WithOverdueMatches = meta.story({
  render: function OverdueStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <AdminDashboardView
          clubSlug="tc-musterstadt"
          clubName="TC Musterstadt"
          inviteCode="TCMS-2026"
          appUrl="http://localhost:3000"
          stats={stats}
          seasons={seasons}
          overdueMatches={overdueMatches}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Overdue matches section IS present
    await expect(
      canvas.getByText("Felix Wagner vs Paul Becker"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Marie Koch vs Lukas Sch\u00e4fer"),
    ).toBeInTheDocument();

    // Badge shows count
    await expect(canvas.getByText("2")).toBeInTheDocument();
  },
});

export const EmptyClub = meta.story({
  render: function EmptyStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <AdminDashboardView
          clubSlug="tc-musterstadt"
          clubName="TC Musterstadt"
          inviteCode="TCMS-2026"
          appUrl="http://localhost:3000"
          stats={{
            memberCount: 0,
            activeSeasonCount: 0,
            openChallengeCount: 0,
          }}
          seasons={[]}
          overdueMatches={[]}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Stats show zeroes
    const zeroes = canvas.getAllByText("0");
    await expect(zeroes.length).toBeGreaterThanOrEqual(3);

    // Empty state for seasons shown
    await expect(
      canvas.getByText(/Erstelle eine neue Saison|Create a new season/),
    ).toBeInTheDocument();
  },
});
