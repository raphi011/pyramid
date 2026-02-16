"use client";

import preview from "#.storybook/preview";
import { within, expect, userEvent } from "storybook/test";
import { PageWrapper } from "./_page-wrapper";
import { CreateSeasonView } from "@/app/(main)/admin/club/[id]/season/new/create-season-view";
import type { SeasonMember, PreviousSeason } from "@/app/lib/db/admin";

const meta = preview.meta({
  title: "Pages/CreateSeason",
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

const members: SeasonMember[] = [
  { id: 1, name: "Julia Fischer" },
  { id: 2, name: "Anna Schmidt" },
  { id: 3, name: "Tom Weber" },
  { id: 4, name: "Lisa Müller" },
  { id: 5, name: "Max Braun" },
  { id: 6, name: "Sophie Hoffmann" },
  { id: 7, name: "Paul Becker" },
  { id: 8, name: "Laura Richter" },
];

const previousSeasons: PreviousSeason[] = [
  { id: 1, name: "Sommer 2025" },
  { id: 2, name: "Winter 2024/25" },
];

export const Default = meta.story({
  render: function DefaultStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <CreateSeasonView
          clubId={1}
          members={members}
          previousSeasons={previousSeasons}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Form sections are present
    await expect(canvas.getByText("Grundlagen")).toBeInTheDocument();
    await expect(canvas.getByText("Wertung")).toBeInTheDocument();
    await expect(canvas.getByText("Fristen")).toBeInTheDocument();
    await expect(canvas.getByText("Startrangfolge")).toBeInTheDocument();

    // Player list renders
    await expect(canvas.getByText("Julia Fischer")).toBeInTheDocument();
    await expect(canvas.getByText("Paul Becker")).toBeInTheDocument();

    // Submit button present
    await expect(
      canvas.getByRole("button", { name: /Saison erstellen/i }),
    ).toBeInTheDocument();

    // Player checkboxes — toggle a member exclusion
    const juliaCheckbox = canvas.getByLabelText("Julia Fischer");
    await expect(juliaCheckbox).toBeChecked();
    await userEvent.click(juliaCheckbox);
    await expect(juliaCheckbox).not.toBeChecked();
  },
});

export const TeamSeason = meta.story({
  render: function TeamStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <CreateSeasonView
          clubId={1}
          members={members}
          previousSeasons={previousSeasons}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Team size field hidden initially (individual type)
    await expect(canvas.queryByLabelText("Teamgröße")).not.toBeInTheDocument();

    // Select "Team" type
    const typeSelect = canvas.getByLabelText("Typ");
    await userEvent.selectOptions(typeSelect, "team");

    // Team size field now visible
    await expect(canvas.getByLabelText("Teamgröße")).toBeInTheDocument();
  },
});

export const WithPreviousSeasons = meta.story({
  render: function PrevSeasonsStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <CreateSeasonView
          clubId={1}
          members={members}
          previousSeasons={previousSeasons}
        />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Starting ranks options present
    await expect(canvas.getByText("Leere Rangliste")).toBeInTheDocument();
    await expect(canvas.getByText("Von vorheriger Saison")).toBeInTheDocument();

    // Season selector hidden initially
    await expect(
      canvas.queryByLabelText("Saison auswählen"),
    ).not.toBeInTheDocument();

    // Click "From previous season" radio
    const fromSeasonRadio = canvas.getByLabelText("Von vorheriger Saison");
    await userEvent.click(fromSeasonRadio);

    // Season selector now visible
    await expect(canvas.getByLabelText("Saison auswählen")).toBeInTheDocument();
  },
});

export const NoPreviousSeasons = meta.story({
  render: function NoPrevStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <CreateSeasonView clubId={1} members={members} previousSeasons={[]} />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // "From season" radio is disabled when no previous seasons
    const fromSeasonRadio = canvas.getByLabelText("Von vorheriger Saison");
    await expect(fromSeasonRadio).toBeDisabled();
  },
});
