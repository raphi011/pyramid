"use client";

import preview from "#.storybook/preview";
import { PageWrapper } from "./_page-wrapper";
import { ClubDetailView } from "@/app/(main)/[slug]/club-detail-view";
import type { TimelineEvent } from "@/components/domain/event-timeline";

const meta = preview.meta({
  title: "Pages/ClubDetail",
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

// ── Mock data ─────────────────────────────────

const fullClub = {
  name: "TC Musterstadt",
  url: "https://tc-musterstadt.de",
  phoneNumber: "+49 89 123456",
  address: "Sportplatzweg 12",
  city: "Musterstadt",
  zip: "80331",
  country: "DE",
  imageId: null,
};

const minimalClub = {
  name: "Badminton Club",
  url: "",
  phoneNumber: "",
  address: "",
  city: "",
  zip: "",
  country: "",
  imageId: null,
};

const members = [
  {
    playerId: 1,
    playerSlug: "anna-mueller",
    firstName: "Anna",
    lastName: "M\u00fcller",
    imageId: null,
    role: "admin" as const,
  },
  {
    playerId: 2,
    playerSlug: "max-weber",
    firstName: "Max",
    lastName: "Weber",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 3,
    playerSlug: "lisa-schmidt",
    firstName: "Lisa",
    lastName: "Schmidt",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 4,
    playerSlug: "tom-fischer",
    firstName: "Tom",
    lastName: "Fischer",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 5,
    playerSlug: "julia-braun",
    firstName: "Julia",
    lastName: "Braun",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 6,
    playerSlug: "felix-wagner",
    firstName: "Felix",
    lastName: "Wagner",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 7,
    playerSlug: "sophie-becker",
    firstName: "Sophie",
    lastName: "Becker",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 8,
    playerSlug: "luca-hoffmann",
    firstName: "Luca",
    lastName: "Hoffmann",
    imageId: null,
    role: "player" as const,
  },
];

const seasons = [
  {
    id: 1,
    slug: "sommer-2026",
    name: "Sommer 2026",
    status: "active" as const,
    playerCount: 18,
    isIndividual: true,
    canEnroll: false,
    isEnrolled: true,
    clubId: 1,
  },
  {
    id: 2,
    slug: "doppel-sommer-2026",
    name: "Doppel Sommer 2026",
    status: "active" as const,
    playerCount: 12,
    isIndividual: false,
    canEnroll: false,
    isEnrolled: false,
    clubId: 1,
  },
  {
    id: 3,
    slug: "herbst-2026",
    name: "Herbst 2026",
    status: "active" as const,
    playerCount: 5,
    isIndividual: true,
    canEnroll: true,
    isEnrolled: false,
    clubId: 1,
  },
  {
    id: 4,
    slug: "winter-2025-26",
    name: "Winter 2025/26",
    status: "ended" as const,
    playerCount: 20,
    isIndividual: true,
    canEnroll: false,
    isEnrolled: true,
    clubId: 1,
  },
  {
    id: 5,
    slug: "sommer-2025",
    name: "Sommer 2025",
    status: "ended" as const,
    playerCount: 16,
    isIndividual: true,
    canEnroll: false,
    isEnrolled: false,
    clubId: 1,
  },
];

const recentActivity: TimelineEvent[] = [
  {
    id: 1,
    type: "result",
    player1: { name: "Anna Müller" },
    player2: { name: "Max Weber" },
    winnerId: "player1",
    scores: [
      [6, 3],
      [4, 6],
      [6, 2],
    ],
    time: "2h ago",
    href: "/tc-musterstadt/sommer-2026/matches/1",
  },
  {
    id: 2,
    type: "challenge",
    challenger: { name: "Tom Fischer" },
    challengee: { name: "Lisa Schmidt" },
    time: "5h ago",
    href: "/tc-musterstadt/sommer-2026/matches/2",
  },
  {
    id: 3,
    type: "new_player",
    player: { name: "Felix Wagner" },
    startingRank: 8,
    time: "1d ago",
  },
];

// ── Stories ───────────────────────────────────

function ClubDetailPage(props: {
  club?: typeof fullClub;
  seasons?: typeof seasons;
  members?: typeof members;
  memberCount?: number;
  recentActivity?: TimelineEvent[];
}) {
  return (
    <PageWrapper activeHref="/club">
      <ClubDetailView
        clubSlug="tc-musterstadt"
        club={props.club ?? fullClub}
        memberCount={props.memberCount ?? (props.members ?? members).length}
        recentActivity={props.recentActivity ?? recentActivity}
        seasons={props.seasons ?? seasons}
        members={props.members ?? members}
      />
    </PageWrapper>
  );
}

export const Default = meta.story({
  render: () => <ClubDetailPage />,
});

export const EmptySeasons = meta.story({
  render: () => <ClubDetailPage seasons={[]} />,
});

export const NoOptionalFields = meta.story({
  render: () => <ClubDetailPage club={minimalClub} />,
});

export const SingleMember = meta.story({
  render: () => <ClubDetailPage members={[members[0]]} memberCount={1} />,
});
