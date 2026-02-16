"use client";

import preview from "#.storybook/preview";
import { within, expect, userEvent } from "storybook/test";
import { PageWrapper } from "./_page-wrapper";
import { AnnouncementsView } from "@/app/(main)/admin/club/[id]/announcements/announcements-view";
import type { PastAnnouncement } from "@/app/lib/db/admin";

const meta = preview.meta({
  title: "Pages/Announcements",
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

const pastAnnouncements: PastAnnouncement[] = [
  {
    id: 1,
    message: "Die Plätze sind nächste Woche wegen Sanierung geschlossen.",
    sentBy: "Julia Fischer",
    sentAt: "vor 3 Tagen",
    emailed: true,
  },
  {
    id: 2,
    message: "Saisonabschlussfeier am 15. September im Clubhaus!",
    sentBy: "Julia Fischer",
    sentAt: "vor 1 Woche",
    emailed: false,
  },
  {
    id: 3,
    message:
      "Neue Saison startet am 1. April. Bitte meldet euch rechtzeitig an.",
    sentBy: "Anna Schmidt",
    sentAt: "vor 2 Wochen",
    emailed: true,
  },
];

export const Default = meta.story({
  render: function DefaultStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <AnnouncementsView pastAnnouncements={pastAnnouncements} />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Form present
    await expect(canvas.getByText("Neue Ankündigung")).toBeInTheDocument();

    // Send button disabled when textarea empty
    const sendBtn = canvas.getByRole("button", { name: /Senden/i });
    await expect(sendBtn).toBeDisabled();

    // Type a message — button becomes enabled
    const textarea = canvas.getByPlaceholderText(/Nachricht eingeben/i);
    await userEvent.type(textarea, "Test-Nachricht");
    await expect(sendBtn).toBeEnabled();

    // Clear text — button disabled again
    await userEvent.clear(textarea);
    await expect(sendBtn).toBeDisabled();

    // Past announcements render
    await expect(
      canvas.getByText("Vergangene Ankündigungen"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText(/Plätze sind nächste Woche/),
    ).toBeInTheDocument();
    await expect(canvas.getByText(/Saisonabschlussfeier/)).toBeInTheDocument();

    // Emailed indicator
    const emailBadges = canvas.getAllByText("Per E-Mail");
    await expect(emailBadges.length).toBeGreaterThanOrEqual(1);
  },
});

export const NoPastAnnouncements = meta.story({
  render: function NoPastStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <AnnouncementsView pastAnnouncements={[]} />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Form is still present
    await expect(canvas.getByText("Neue Ankündigung")).toBeInTheDocument();

    // Empty state for past announcements
    await expect(canvas.getByText("Keine Ankündigungen")).toBeInTheDocument();
  },
});
