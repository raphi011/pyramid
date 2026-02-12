import preview from "#.storybook/preview";
import { fn } from "storybook/test";
import { MatchRow } from "@/components/domain/match-row";
import { maxMustermann, annaSchmidt } from "../__fixtures__";

const meta = preview.meta({
  title: "Domain/MatchRow",
  component: MatchRow,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    onClick: fn(),
  },
  argTypes: {
    status: {
      control: "select",
      options: ["challenged", "date_set", "completed", "withdrawn", "forfeited"],
    },
    position: {
      control: "radio",
      options: ["first", "middle", "last", "only"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Challenged = meta.story({
  args: {
    player1: maxMustermann,
    player2: annaSchmidt,
    status: "challenged",
  },
});

export const DateSet = meta.story({
  args: {
    player1: maxMustermann,
    player2: annaSchmidt,
    status: "date_set",
    date: "Sa, 15.03.2026",
  },
});

export const CompletedWin = meta.story({
  args: {
    player1: maxMustermann,
    player2: annaSchmidt,
    status: "completed",
    winnerId: "player1",
    scores: [[6, 4], [3, 6], [7, 5]],
    date: "12.03.2026",
  },
});

export const CompletedLoss = meta.story({
  args: {
    player1: maxMustermann,
    player2: annaSchmidt,
    status: "completed",
    winnerId: "player2",
    scores: [[4, 6], [2, 6]],
    date: "10.03.2026",
  },
});

export const Withdrawn = meta.story({
  args: {
    player1: maxMustermann,
    player2: annaSchmidt,
    status: "withdrawn",
    date: "08.03.2026",
  },
});

export const Forfeited = meta.story({
  args: {
    player1: maxMustermann,
    player2: annaSchmidt,
    status: "forfeited",
    date: "05.03.2026",
  },
});

export const AllStatuses = meta.story({
  render: () => (
    <div className="space-y-3">
      <MatchRow player1={maxMustermann} player2={annaSchmidt} status="challenged" onClick={fn()} />
      <MatchRow player1={maxMustermann} player2={annaSchmidt} status="date_set" date="Sa, 15.03." onClick={fn()} />
      <MatchRow player1={maxMustermann} player2={annaSchmidt} status="completed" winnerId="player1" scores={[[6,4],[7,5]]} />
      <MatchRow player1={maxMustermann} player2={annaSchmidt} status="withdrawn" />
      <MatchRow player1={maxMustermann} player2={annaSchmidt} status="forfeited" />
    </div>
  ),
});
