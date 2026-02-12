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
      options: ["result", "challenge", "withdrawal", "forfeit", "new_player", "unavailable"],
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

export const AllTypes = meta.story({
  render: () => (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {allEventTypes.map((e, i) => (
        <EventItem key={i} {...e} />
      ))}
    </div>
  ),
});
