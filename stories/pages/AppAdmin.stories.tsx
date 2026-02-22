"use client";

import preview from "#.storybook/preview";
import { within, expect } from "storybook/test";
import { PageWrapper } from "./_page-wrapper";
import { AppAdminView } from "@/app/(main)/admin/app-admin-view";
import type { AppStats, AdminClub, AppAdmin } from "@/app/lib/db/admin";

const meta = preview.meta({
  title: "Pages/AppAdmin",
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

const stats: AppStats = {
  totalClubs: 5,
  totalPlayers: 87,
  totalSeasons: 12,
};

const clubs: AdminClub[] = [
  {
    id: 1,
    name: "TC Musterstadt",
    slug: "tc-musterstadt",
    memberCount: 24,
    isDisabled: false,
    adminEmail: "admin@tc-musterstadt.de",
  },
  {
    id: 2,
    name: "SC Beispieldorf",
    slug: "sc-beispieldorf",
    memberCount: 18,
    isDisabled: false,
    adminEmail: "admin@sc-beispieldorf.de",
  },
  {
    id: 3,
    name: "TV Sportheim",
    slug: "tv-sportheim",
    memberCount: 32,
    isDisabled: false,
    adminEmail: "admin@tv-sportheim.de",
  },
];

const appAdmins: AppAdmin[] = [
  { id: 1, email: "superadmin@pyramid.app" },
  { id: 2, email: "backup@pyramid.app" },
];

export const Default = meta.story({
  render: function DefaultStory() {
    return (
      <PageWrapper activeHref="/admin" isAdmin>
        <AppAdminView stats={stats} clubs={clubs} appAdmins={appAdmins} />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Stats render
    await expect(canvas.getByText("5")).toBeInTheDocument();
    await expect(canvas.getByText("87")).toBeInTheDocument();
    await expect(canvas.getByText("12")).toBeInTheDocument();

    // Clubs render (ClubSwitcher in PageWrapper also contains "TC Musterstadt")
    await expect(
      canvas.getAllByText("TC Musterstadt").length,
    ).toBeGreaterThanOrEqual(1);
    await expect(canvas.getByText("SC Beispieldorf")).toBeInTheDocument();

    // Admins render
    await expect(
      canvas.getByText("superadmin@pyramid.app"),
    ).toBeInTheDocument();
  },
});

export const EmptyState = meta.story({
  render: function EmptyStory() {
    return (
      <PageWrapper activeHref="/admin" isAdmin>
        <AppAdminView
          stats={{ totalClubs: 0, totalPlayers: 0, totalSeasons: 0 }}
          clubs={[]}
          appAdmins={[]}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Stats show zeroes
    const zeroes = canvas.getAllByText("0");
    await expect(zeroes.length).toBeGreaterThanOrEqual(3);

    // Empty states
    await expect(canvas.getByText("Keine Vereine")).toBeInTheDocument();
    await expect(canvas.getByText("Keine Administratoren")).toBeInTheDocument();
  },
});

export const WithDisabledClub = meta.story({
  render: function DisabledStory() {
    const clubsWithDisabled: AdminClub[] = [
      ...clubs,
      {
        id: 4,
        name: "Inaktiver Verein",
        slug: "inaktiver-verein",
        memberCount: 5,
        isDisabled: true,
        adminEmail: "old@inactive.de",
      },
    ];
    return (
      <PageWrapper activeHref="/admin" isAdmin>
        <AppAdminView
          stats={{ ...stats, totalClubs: 6 }}
          clubs={clubsWithDisabled}
          appAdmins={appAdmins}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Disabled club is shown
    await expect(canvas.getByText("Inaktiver Verein")).toBeInTheDocument();

    // Disabled badge
    await expect(canvas.getByText("Deaktiviert")).toBeInTheDocument();

    // Enable button on disabled club (exact match to avoid matching "Deaktivieren")
    await expect(
      canvas.getByRole("button", { name: "Aktivieren" }),
    ).toBeInTheDocument();
  },
});
