"use client";

import preview from "#.storybook/preview";
import { PageWrapper } from "./_page-wrapper";
import { ClubDetailView } from "@/app/(main)/club/[slug]/club-detail-view";

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
    firstName: "Anna",
    lastName: "M\u00fcller",
    imageId: null,
    role: "admin" as const,
  },
  {
    playerId: 2,
    firstName: "Max",
    lastName: "Weber",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 3,
    firstName: "Lisa",
    lastName: "Schmidt",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 4,
    firstName: "Tom",
    lastName: "Fischer",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 5,
    firstName: "Julia",
    lastName: "Braun",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 6,
    firstName: "Felix",
    lastName: "Wagner",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 7,
    firstName: "Sophie",
    lastName: "Becker",
    imageId: null,
    role: "player" as const,
  },
  {
    playerId: 8,
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

// ── Stories ───────────────────────────────────

function ClubDetailPage(props: {
  club?: typeof fullClub;
  seasons?: typeof seasons;
  members?: typeof members;
  memberCount?: number;
}) {
  return (
    <PageWrapper activeHref="/club">
      <ClubDetailView
        clubSlug="tc-musterstadt"
        club={props.club ?? fullClub}
        memberCount={props.memberCount ?? (props.members ?? members).length}
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
