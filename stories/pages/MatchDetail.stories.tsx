"use client";

import preview from "#.storybook/preview";
import { PageWrapper } from "./_page-wrapper";
import { MatchDetailView } from "@/app/(main)/[slug]/[seasonSlug]/matches/[id]/match-detail-view";
import type { MatchStatus } from "@/app/lib/db/match";
import type { TimelineEvent } from "@/components/domain/event-timeline";

const meta = preview.meta({
  title: "Pages/MatchDetail",
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

// ── Shared mock data ──────────────────────────────────

function makeMatch(overrides: Partial<MockMatch> = {}): MockMatch {
  return {
    id: 1,
    seasonId: 1,
    team1Id: 10,
    team2Id: 20,
    team1Name: "Max Braun",
    team2Name: "Lisa Müller",
    team1Score: null,
    team2Score: null,
    winnerTeamId: null,
    status: "challenged",
    created: "2026-02-03T10:00:00Z",
    gameAt: null,
    resultEnteredBy: null,
    confirmedBy: null,
    team1PlayerId: 1,
    team2PlayerId: 2,
    seasonBestOf: 3,
    clubId: 1,
    imageId: null,
    imageSrc: null,
    ...overrides,
  };
}

type MockMatch = {
  id: number;
  seasonId: number;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  team1Score: number[] | null;
  team2Score: number[] | null;
  winnerTeamId: number | null;
  status: MatchStatus;
  created: string;
  gameAt: string | null;
  resultEnteredBy: number | null;
  confirmedBy: number | null;
  team1PlayerId: number;
  team2PlayerId: number;
  seasonBestOf: number;
  clubId: number;
  imageId: string | null;
  imageSrc: string | null;
};

const mockProposals = [
  {
    id: 1,
    matchId: 1,
    proposedBy: 1,
    proposedByName: "Max Braun",
    proposedDatetime: "2026-02-15T10:00:00Z",
    status: "pending",
    created: "2026-02-04T08:00:00Z",
  },
  {
    id: 2,
    matchId: 1,
    proposedBy: 1,
    proposedByName: "Max Braun",
    proposedDatetime: "2026-02-16T14:00:00Z",
    status: "pending",
    created: "2026-02-04T08:05:00Z",
  },
  {
    id: 3,
    matchId: 1,
    proposedBy: 2,
    proposedByName: "Lisa Müller",
    proposedDatetime: "2026-02-18T18:00:00Z",
    status: "declined",
    created: "2026-02-04T09:00:00Z",
  },
];

const mockComments = [
  {
    id: 1,
    matchId: 1,
    playerId: 1,
    playerName: "Max Braun",
    comment: "Wann passt es dir am besten?",
    created: "2026-02-04T08:00:00Z",
    editedAt: null,
  },
  {
    id: 2,
    matchId: 1,
    playerId: 2,
    playerName: "Lisa Müller",
    comment: "Samstag Vormittag wäre super!",
    created: "2026-02-04T09:00:00Z",
    editedAt: null,
  },
];

const mockEvents: TimelineEvent[] = [
  {
    id: 101,
    type: "challenge",
    challenger: { name: "Max Braun" },
    challengee: { name: "Lisa Müller" },
    time: "3d ago",
    group: "3. Februar",
    groupDate: "Montag, 3. Februar 2026",
  },
  {
    id: 102,
    type: "date_proposed",
    player: { name: "Max Braun" },
    opponent: { name: "Lisa Müller" },
    proposedDate: "2026-02-15T10:00:00Z",
    personal: true,
    time: "2d ago",
    group: "4. Februar",
    groupDate: "Dienstag, 4. Februar 2026",
  },
  {
    id: 103,
    type: "date_accepted",
    player: { name: "Lisa Müller" },
    opponent: { name: "Max Braun" },
    acceptedDate: "2026-02-15T10:00:00Z",
    personal: true,
    time: "2d ago",
    group: "4. Februar",
    groupDate: "Dienstag, 4. Februar 2026",
  },
];

const mockCompletedEvents: TimelineEvent[] = [
  ...mockEvents,
  {
    id: 104,
    type: "result_entered",
    player1: { name: "Max Braun" },
    player2: { name: "Lisa Müller" },
    scores: [
      [6, 3],
      [7, 5],
    ],
    personal: true,
    time: "8h ago",
    group: "10. Februar",
    groupDate: "Montag, 10. Februar 2026",
  },
  {
    id: 105,
    type: "result",
    player1: { name: "Max Braun" },
    player2: { name: "Lisa Müller" },
    winnerId: "player1",
    scores: [
      [6, 3],
      [7, 5],
    ],
    time: "7h ago",
    group: "10. Februar",
    groupDate: "Montag, 10. Februar 2026",
  },
];

// ── Stories ───────────────────────────────────────────

export const Challenged = meta.story({
  render: function ChallengedStory() {
    return (
      <PageWrapper activeHref="/tc-musterstadt/sommer-2026">
        <MatchDetailView
          match={makeMatch()}
          proposals={mockProposals}
          comments={mockComments}
          events={mockEvents}
          userRole="team2"
          currentPlayerId={2}
          team1Rank={5}
          team2Rank={4}
          isAdmin={false}
        />
      </PageWrapper>
    );
  },
});

export const DateSet = meta.story({
  render: function DateSetStory() {
    return (
      <PageWrapper activeHref="/tc-musterstadt/sommer-2026">
        <MatchDetailView
          match={makeMatch({
            status: "date_set",
            gameAt: "2026-02-15T10:00:00Z",
          })}
          proposals={[
            { ...mockProposals[0], status: "accepted" },
            { ...mockProposals[1], status: "dismissed" },
          ]}
          comments={mockComments}
          events={mockEvents}
          userRole="team1"
          currentPlayerId={1}
          team1Rank={5}
          team2Rank={4}
          isAdmin={false}
        />
      </PageWrapper>
    );
  },
});

export const PendingConfirmation = meta.story({
  render: function PendingConfirmationStory() {
    return (
      <PageWrapper activeHref="/tc-musterstadt/sommer-2026">
        <MatchDetailView
          match={makeMatch({
            status: "pending_confirmation",
            gameAt: "2026-02-15T10:00:00Z",
            team1Score: [6, 7],
            team2Score: [3, 5],
            winnerTeamId: 10,
            resultEnteredBy: 1,
          })}
          proposals={[]}
          comments={[]}
          events={mockCompletedEvents.slice(0, -1)}
          userRole="team2"
          currentPlayerId={2}
          team1Rank={5}
          team2Rank={4}
          isAdmin={false}
        />
      </PageWrapper>
    );
  },
});

export const PendingConfirmationAsEnterer = meta.story({
  render: function PendingConfirmationAsEntererStory() {
    return (
      <PageWrapper activeHref="/tc-musterstadt/sommer-2026">
        <MatchDetailView
          match={makeMatch({
            status: "pending_confirmation",
            gameAt: "2026-02-15T10:00:00Z",
            team1Score: [6, 7],
            team2Score: [3, 5],
            winnerTeamId: 10,
            resultEnteredBy: 1,
          })}
          proposals={[]}
          comments={[]}
          events={mockCompletedEvents.slice(0, -1)}
          userRole="team1"
          currentPlayerId={1}
          team1Rank={5}
          team2Rank={4}
          isAdmin={false}
        />
      </PageWrapper>
    );
  },
});

export const Completed = meta.story({
  render: function CompletedStory() {
    return (
      <PageWrapper activeHref="/tc-musterstadt/sommer-2026">
        <MatchDetailView
          match={makeMatch({
            status: "completed",
            gameAt: "2026-02-10T10:00:00Z",
            team1Score: [6, 7],
            team2Score: [3, 5],
            winnerTeamId: 10,
            resultEnteredBy: 1,
            confirmedBy: 2,
          })}
          proposals={[]}
          comments={mockComments}
          events={mockCompletedEvents}
          userRole="team1"
          currentPlayerId={1}
          team1Rank={4}
          team2Rank={5}
          isAdmin={false}
        />
      </PageWrapper>
    );
  },
});

export const WithDateProposals = meta.story({
  render: function WithDateProposalsStory() {
    return (
      <PageWrapper activeHref="/tc-musterstadt/sommer-2026">
        <MatchDetailView
          match={makeMatch()}
          proposals={mockProposals}
          comments={[]}
          events={mockEvents}
          userRole="team2"
          currentPlayerId={2}
          team1Rank={5}
          team2Rank={4}
          isAdmin={false}
        />
      </PageWrapper>
    );
  },
});

export const AsSpectator = meta.story({
  render: function AsSpectatorStory() {
    return (
      <PageWrapper activeHref="/tc-musterstadt/sommer-2026">
        <MatchDetailView
          match={makeMatch({
            status: "date_set",
            gameAt: "2026-02-15T10:00:00Z",
          })}
          proposals={[{ ...mockProposals[0], status: "accepted" }]}
          comments={mockComments}
          events={mockEvents}
          userRole="spectator"
          currentPlayerId={99}
          team1Rank={5}
          team2Rank={4}
          isAdmin={false}
        />
      </PageWrapper>
    );
  },
});
