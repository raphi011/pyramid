"use client";

import preview from "#.storybook/preview";
import { within, expect, userEvent } from "storybook/test";
import { PageWrapper } from "./_page-wrapper";
import { SeasonManagementView } from "@/app/(main)/admin/club/[id]/season/[seasonId]/season-management-view";
import type { SeasonDetail } from "@/app/lib/db/admin";

const meta = preview.meta({
  title: "Pages/SeasonManagement",
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

const activeSeason: SeasonDetail = {
  id: 1,
  name: "Sommer 2026",
  status: "active",
  bestOf: 3,
  matchDeadlineDays: 14,
  reminderDays: 7,
  requiresResultConfirmation: false,
  openEnrollment: true,
  isTeamSeason: false,
  maxTeamSize: 1,
};

const draftSeason: SeasonDetail = {
  ...activeSeason,
  id: 2,
  name: "Herbst 2026",
  status: "draft",
};

const teamSeason: SeasonDetail = {
  ...activeSeason,
  id: 3,
  name: "Doppel Sommer 2026",
  isTeamSeason: true,
  maxTeamSize: 2,
};

const endedSeason: SeasonDetail = {
  ...activeSeason,
  id: 4,
  name: "Winter 2025/26",
  status: "ended",
};

export const ActiveSeason = meta.story({
  render: function ActiveStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <SeasonManagementView
          season={activeSeason}
          playerCount={18}
          optedOutCount={2}
          clubId={1}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Title and status
    await expect(canvas.getByText("Sommer 2026")).toBeInTheDocument();
    await expect(canvas.getByText("Aktiv")).toBeInTheDocument();

    // Configuration section
    await expect(canvas.getByText("Konfiguration")).toBeInTheDocument();

    // End season button is present but disabled (stub)
    const endBtn = canvas.getByRole("button", { name: /Saison beenden/i });
    await expect(endBtn).toBeInTheDocument();
    await expect(endBtn).toBeDisabled();

    // Start button absent
    await expect(
      canvas.queryByRole("button", { name: /Saison starten/i }),
    ).not.toBeInTheDocument();
  },
});

export const DraftSeason = meta.story({
  render: function DraftStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <SeasonManagementView
          season={draftSeason}
          playerCount={24}
          optedOutCount={0}
          clubId={1}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Entwurf")).toBeInTheDocument();

    // Start button (not End)
    await expect(
      canvas.getByRole("button", { name: /Saison starten/i }),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: /Saison beenden/i }),
    ).not.toBeInTheDocument();
  },
});

export const TeamSeason = meta.story({
  render: function TeamStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <SeasonManagementView
          season={teamSeason}
          playerCount={16}
          optedOutCount={0}
          clubId={1}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Teams section is present
    await expect(canvas.getByText("Teams")).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /Teams verwalten/i }),
    ).toBeInTheDocument();
  },
});

export const EndedSeason = meta.story({
  render: function EndedStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <SeasonManagementView
          season={endedSeason}
          playerCount={18}
          optedOutCount={2}
          clubId={1}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Beendet")).toBeInTheDocument();

    // No lifecycle buttons
    await expect(
      canvas.queryByRole("button", { name: /Saison beenden/i }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: /Saison starten/i }),
    ).not.toBeInTheDocument();

    // No save button (read-only)
    await expect(
      canvas.queryByRole("button", { name: /Änderungen speichern/i }),
    ).not.toBeInTheDocument();

    // Form fields are disabled in ended state
    const nameInput = canvas.getByLabelText("Name");
    await expect(nameInput).toBeDisabled();
  },
});
