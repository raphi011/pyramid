"use client";

import preview from "#.storybook/preview";
import { within, expect, userEvent } from "storybook/test";
import { PageWrapper } from "./_page-wrapper";
import { TeamManagementView } from "@/app/(main)/admin/club/[slug]/season/[seasonSlug]/teams/team-management-view";
import type { Team, TeamMember } from "@/app/lib/db/admin";

const meta = preview.meta({
  title: "Pages/TeamManagement",
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

const teams: Team[] = [
  {
    id: 1,
    name: "Team Alpha",
    members: [
      { id: 1, name: "Julia Fischer" },
      { id: 2, name: "Anna Schmidt" },
    ],
  },
  {
    id: 2,
    name: "Team Beta",
    members: [
      { id: 3, name: "Tom Weber" },
      { id: 4, name: "Lisa Müller" },
    ],
  },
  {
    id: 3,
    name: "Team Gamma",
    members: [
      { id: 5, name: "Max Braun" },
      { id: 6, name: "Sophie Hoffmann" },
    ],
  },
];

const unassignedPlayers: TeamMember[] = [
  { id: 7, name: "Paul Becker" },
  { id: 8, name: "Laura Richter" },
];

export const Default = meta.story({
  render: function DefaultStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <TeamManagementView
          seasonName="Doppel Sommer 2026"
          teams={teams}
          unassignedPlayers={[]}
          clubId={1}
          seasonId={1}
          clubSlug="tc-musterstadt"
          seasonSlug="doppel-sommer-2026"
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Teams render
    await expect(canvas.getByText("Team Alpha")).toBeInTheDocument();
    await expect(canvas.getByText("Team Beta")).toBeInTheDocument();
    await expect(canvas.getByText("Team Gamma")).toBeInTheDocument();

    // Team members render
    await expect(canvas.getByText("Julia Fischer")).toBeInTheDocument();
    await expect(canvas.getByText("Tom Weber")).toBeInTheDocument();

    // No unassigned section
    await expect(
      canvas.queryByText("Nicht zugewiesene Spieler"),
    ).not.toBeInTheDocument();

    // Delete buttons are disabled (stub)
    const deleteButtons = canvas.getAllByRole("button", {
      name: /Löschen/i,
    });
    for (const btn of deleteButtons) {
      await expect(btn).toBeDisabled();
    }

    // Click "Create team" to toggle form
    const createBtn = canvas.getByRole("button", { name: /Team erstellen/i });
    await userEvent.click(createBtn);

    // Create form appears
    await expect(canvas.getByLabelText("Teamname")).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Erstellen" }),
    ).toBeInTheDocument();
  },
});

export const WithUnassignedPlayers = meta.story({
  render: function UnassignedStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <TeamManagementView
          seasonName="Doppel Sommer 2026"
          teams={teams}
          unassignedPlayers={unassignedPlayers}
          clubId={1}
          seasonId={1}
          clubSlug="tc-musterstadt"
          seasonSlug="doppel-sommer-2026"
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Unassigned section present
    await expect(
      canvas.getByText("Nicht zugewiesene Spieler"),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Paul Becker")).toBeInTheDocument();
    await expect(canvas.getByText("Laura Richter")).toBeInTheDocument();
  },
});

export const EmptyTeams = meta.story({
  render: function EmptyStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <TeamManagementView
          seasonName="Doppel Sommer 2026"
          teams={[]}
          unassignedPlayers={unassignedPlayers}
          clubId={1}
          seasonId={1}
          clubSlug="tc-musterstadt"
          seasonSlug="doppel-sommer-2026"
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Empty state
    await expect(canvas.getByText("Keine Teams")).toBeInTheDocument();

    // Unassigned still visible
    await expect(canvas.getByText("Paul Becker")).toBeInTheDocument();
  },
});
