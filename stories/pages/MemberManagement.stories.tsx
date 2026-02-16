"use client";

import preview from "#.storybook/preview";
import { within, expect, userEvent } from "storybook/test";
import { PageWrapper } from "./_page-wrapper";
import { MemberManagementView } from "@/app/(main)/admin/club/[id]/members/member-management-view";
import type { ClubMember } from "@/app/lib/db/admin";

const meta = preview.meta({
  title: "Pages/MemberManagement",
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

const members: ClubMember[] = [
  {
    id: 1,
    name: "Julia Fischer",
    email: "julia.fischer@example.com",
    role: "admin",
  },
  {
    id: 2,
    name: "Anna Schmidt",
    email: "anna.schmidt@example.com",
    role: "admin",
  },
  {
    id: 3,
    name: "Tom Weber",
    email: "tom.weber@example.com",
    role: "player",
  },
  {
    id: 4,
    name: "Lisa Müller",
    email: "lisa.mueller@example.com",
    role: "player",
  },
  {
    id: 5,
    name: "Max Braun",
    email: "max.braun@example.com",
    role: "player",
  },
  {
    id: 6,
    name: "Sophie Hoffmann",
    email: "sophie.hoffmann@example.com",
    role: "player",
  },
];

export const Default = meta.story({
  render: function DefaultStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <MemberManagementView clubId={1} members={members} />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Title with count
    await expect(canvas.getByText(/Mitglieder \(6\)/)).toBeInTheDocument();

    // Members render (Avatar sr-only duplicates visible name, so use getAllByText)
    await expect(
      canvas.getAllByText("Julia Fischer").length,
    ).toBeGreaterThanOrEqual(1);
    await expect(
      canvas.getAllByText("Tom Weber").length,
    ).toBeGreaterThanOrEqual(1);

    // Role badges
    const adminBadges = canvas.getAllByText("Admin");
    await expect(adminBadges.length).toBeGreaterThanOrEqual(2);

    // Invite button — click to show form
    const inviteBtn = canvas.getByRole("button", { name: /Einladen/i });
    await expect(inviteBtn).toBeInTheDocument();
    await expect(
      canvas.queryByText("Neues Mitglied einladen"),
    ).not.toBeInTheDocument();

    await userEvent.click(inviteBtn);

    // Invite form is now visible
    await expect(
      canvas.getByText("Neues Mitglied einladen"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: /Einladung senden/i }),
    ).toBeInTheDocument();
  },
});

export const WithSearch = meta.story({
  render: function SearchStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <MemberManagementView clubId={1} members={members} />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const searchInput = canvas.getByPlaceholderText(/Mitglied suchen/i);
    await expect(searchInput).toBeInTheDocument();

    // All members visible initially
    await expect(
      canvas.getAllByText("Julia Fischer").length,
    ).toBeGreaterThanOrEqual(1);
    await expect(
      canvas.getAllByText("Tom Weber").length,
    ).toBeGreaterThanOrEqual(1);

    // Type a search query that matches only one member
    await userEvent.type(searchInput, "Tom");

    // Tom visible, Julia filtered out
    await expect(
      canvas.getAllByText("Tom Weber").length,
    ).toBeGreaterThanOrEqual(1);
    await expect(canvas.queryByText("Julia Fischer")).not.toBeInTheDocument();
    await expect(canvas.queryByText("Lisa Müller")).not.toBeInTheDocument();
  },
});

export const SingleAdmin = meta.story({
  render: function SingleAdminStory() {
    const singleAdminMembers: ClubMember[] = [
      {
        id: 1,
        name: "Julia Fischer",
        email: "julia.fischer@example.com",
        role: "admin",
      },
      {
        id: 2,
        name: "Tom Weber",
        email: "tom.weber@example.com",
        role: "player",
      },
      {
        id: 3,
        name: "Lisa Müller",
        email: "lisa.mueller@example.com",
        role: "player",
      },
    ];
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <MemberManagementView clubId={1} members={singleAdminMembers} />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Admin's demote button should be disabled (only admin)
    const demoteButtons = canvas.getAllByRole("button", {
      name: /Herabstufen/i,
    });
    await expect(demoteButtons[0]).toBeDisabled();
  },
});

export const EmptyClub = meta.story({
  render: function EmptyStory() {
    return (
      <PageWrapper activeHref="/admin/club/1" isAdmin>
        <MemberManagementView clubId={1} members={[]} />
      </PageWrapper>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Empty state
    await expect(canvas.getByText("Keine Mitglieder")).toBeInTheDocument();
  },
});
