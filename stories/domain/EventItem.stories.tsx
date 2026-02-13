import preview from "#.storybook/preview";
import { EventItem } from "@/components/domain/event-item";
import { maxMustermann, annaSchmidt, tomWeber, lisaMueller, sarahHoffmann, erikMeier, sophieHoffmann } from "../__fixtures__";
import { allEventTypes } from "../__fixtures__";

const meta = preview.meta({
  title: "Domain/EventItem",
  component: EventItem,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    type: {
      control: "select",
      options: [
        "result", "challenge", "withdrawal", "forfeit", "new_player", "unavailable",
        "challenged", "challenge_accepted", "challenge_withdrawn",
        "date_proposed", "date_accepted", "date_reminder",
        "result_entered", "result_confirmed", "result_disputed",
        "announcement", "deadline_exceeded",
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[640px]">
        <Story />
      </div>
    ),
  ],
});

export default meta;

// ── Public events ───────────────────────────────

export const Result = meta.story({
  args: {
    type: "result",
    player1: maxMustermann,
    player2: annaSchmidt,
    winnerId: "player1",
    scores: [[6, 4], [3, 6], [7, 5]],
    rankBefore: 5,
    rankAfter: 3,
    time: "14:30",
  },
});

export const Challenge = meta.story({
  args: {
    type: "challenge",
    challenger: tomWeber,
    challengee: annaSchmidt,
    time: "11:45",
  },
});

export const Withdrawal = meta.story({
  args: {
    type: "withdrawal",
    player: maxMustermann,
    opponent: annaSchmidt,
    reason: "Terminkonflikt",
    time: "16:20",
  },
});

export const WithdrawalNoReason = meta.story({
  args: {
    type: "withdrawal",
    player: maxMustermann,
    opponent: annaSchmidt,
    time: "16:20",
  },
});

export const Forfeit = meta.story({
  args: {
    type: "forfeit",
    player: lisaMueller,
    opponent: tomWeber,
    reason: "Verletzung",
    time: "09:15",
  },
});

export const NewPlayer = meta.story({
  args: {
    type: "new_player",
    player: sarahHoffmann,
    startingRank: 12,
    time: "10:30",
  },
});

export const UnavailableWithDate = meta.story({
  args: {
    type: "unavailable",
    player: erikMeier,
    returnDate: "20.03.2026",
    time: "12:00",
  },
});

export const AvailableAgain = meta.story({
  args: {
    type: "unavailable",
    player: sophieHoffmann,
    time: "15:45",
  },
});

// ── Personal notification events ────────────────

export const Challenged = meta.story({
  args: {
    type: "challenged",
    challenger: tomWeber,
    challengee: maxMustermann,
    personal: true,
    time: "16:00",
  },
});

export const ChallengeAccepted = meta.story({
  args: {
    type: "challenge_accepted",
    challenger: maxMustermann,
    challengee: annaSchmidt,
    personal: true,
    time: "15:30",
  },
});

export const ChallengeWithdrawn = meta.story({
  args: {
    type: "challenge_withdrawn",
    player: tomWeber,
    opponent: maxMustermann,
    personal: true,
    time: "14:45",
  },
});

export const DateProposed = meta.story({
  args: {
    type: "date_proposed",
    player: annaSchmidt,
    opponent: maxMustermann,
    proposedDate: "Sa, 15.03.2026 18:00",
    personal: true,
    time: "13:20",
  },
});

export const DateAccepted = meta.story({
  args: {
    type: "date_accepted",
    player: maxMustermann,
    opponent: annaSchmidt,
    acceptedDate: "Sa, 15.03.2026 18:00",
    personal: true,
    time: "12:10",
  },
});

export const DateReminder = meta.story({
  args: {
    type: "date_reminder",
    player: maxMustermann,
    opponent: tomWeber,
    daysLeft: 3,
    personal: true,
    time: "09:00",
  },
});

export const ResultEntered = meta.story({
  args: {
    type: "result_entered",
    player1: annaSchmidt,
    player2: maxMustermann,
    scores: [[6, 4], [7, 5]],
    personal: true,
    time: "17:00",
  },
});

export const ResultConfirmed = meta.story({
  args: {
    type: "result_confirmed",
    player1: maxMustermann,
    player2: annaSchmidt,
    scores: [[6, 4], [7, 5]],
    personal: true,
    time: "17:30",
  },
});

export const ResultDisputed = meta.story({
  args: {
    type: "result_disputed",
    player1: tomWeber,
    player2: maxMustermann,
    personal: true,
    time: "18:00",
  },
});

export const Announcement = meta.story({
  args: {
    type: "announcement",
    message: "Platzsperre am 20.03. wegen Sanierung",
    adminName: "Admin Peter",
    time: "08:00",
  },
});

export const DeadlineExceeded = meta.story({
  args: {
    type: "deadline_exceeded",
    player: maxMustermann,
    opponent: lisaMueller,
    daysOver: 3,
    personal: true,
    time: "07:00",
  },
});

// ── Combined view ───────────────────────────────

export const AllTypes = meta.story({
  render: () => (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {allEventTypes.map((e, i) => (
        <EventItem key={i} {...e} />
      ))}
    </div>
  ),
});
