"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MatchScoreInput, type SetScore } from "@/components/domain/match-score-input";

const meta: Meta<typeof MatchScoreInput> = {
  title: "Domain/MatchScoreInput",
  component: MatchScoreInput,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MatchScoreInput>;

function ScoreDemo({ initial, maxSets }: { initial: SetScore[]; maxSets?: number }) {
  const [sets, setSets] = useState(initial);
  return (
    <MatchScoreInput
      sets={sets}
      onChange={setSets}
      maxSets={maxSets}
      player1Name="Max"
      player2Name="Anna"
    />
  );
}

export const BestOfThree: Story = {
  render: () => (
    <ScoreDemo
      initial={[
        { player1: "", player2: "" },
        { player1: "", player2: "" },
        { player1: "", player2: "" },
      ]}
      maxSets={3}
    />
  ),
};

export const BestOfFive: Story = {
  render: () => (
    <ScoreDemo initial={[{ player1: "", player2: "" }]} maxSets={5} />
  ),
};

export const PartiallyFilled: Story = {
  render: () => (
    <ScoreDemo
      initial={[
        { player1: "6", player2: "4" },
        { player1: "3", player2: "6" },
        { player1: "", player2: "" },
      ]}
      maxSets={3}
    />
  ),
};

export const WithError: Story = {
  render: () => {
    const [sets, setSets] = useState<SetScore[]>([
      { player1: "6", player2: "6" },
    ]);
    return (
      <MatchScoreInput
        sets={sets}
        onChange={setSets}
        error="Ungültiges Ergebnis: Kein Gewinner erkennbar."
      />
    );
  },
};

export const ReadOnly: Story = {
  render: () => (
    <MatchScoreInput
      sets={[
        { player1: "6", player2: "4" },
        { player1: "3", player2: "6" },
        { player1: "7", player2: "5" },
      ]}
      onChange={() => {}}
      readOnly
      player1Name="Max"
      player2Name="Anna"
    />
  ),
};
