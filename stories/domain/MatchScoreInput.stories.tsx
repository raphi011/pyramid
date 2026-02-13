"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import { MatchScoreInput, type SetScore } from "@/components/domain/match-score-input";
import { emptyThreeSets, emptyOneSet, partiallyFilledSets, completedSets, invalidSets } from "../__fixtures__";

const meta = preview.meta({
  title: "Domain/MatchScoreInput",
  component: MatchScoreInput,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
});

export default meta;

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

export const BestOfThree = meta.story({
  render: () => <ScoreDemo initial={emptyThreeSets} maxSets={3} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 3 sets × 2 inputs = 6 spinbuttons
    const inputs = canvas.getAllByRole("spinbutton");
    await expect(inputs).toHaveLength(6);

    // Fill first set: 6-4
    await userEvent.type(inputs[0], "6");
    await userEvent.type(inputs[1], "4");

    // Fill second set: 3-6
    await userEvent.type(inputs[2], "3");
    await userEvent.type(inputs[3], "6");

    // Fill third set: 7-5
    await userEvent.type(inputs[4], "7");
    await userEvent.type(inputs[5], "5");

    // No "add set" button — already at maxSets=3
    await expect(canvas.queryByRole("button", { name: /satz hinzufügen/i })).not.toBeInTheDocument();
  },
});

export const BestOfFive = meta.story({
  render: () => <ScoreDemo initial={emptyOneSet} maxSets={5} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially one set row = 2 spinbuttons
    const initialInputs = canvas.getAllByRole("spinbutton");
    await expect(initialInputs).toHaveLength(2);

    // Enter scores in first set
    await userEvent.type(initialInputs[0], "6");
    await userEvent.type(initialInputs[1], "4");

    // Click "Add set" button
    await userEvent.click(canvas.getByRole("button", { name: /satz hinzufügen/i }));

    // Now 2 sets = 4 spinbuttons
    const afterAddInputs = canvas.getAllByRole("spinbutton");
    await expect(afterAddInputs).toHaveLength(4);
  },
});

export const PartiallyFilled = meta.story({
  render: () => <ScoreDemo initial={partiallyFilledSets} maxSets={3} />,
});

function WithErrorDemo() {
  const [sets, setSets] = useState<SetScore[]>(invalidSets);
  return (
    <MatchScoreInput
      sets={sets}
      onChange={setSets}
      error="Ungültiges Ergebnis: Kein Gewinner erkennbar."
    />
  );
}

export const WithError = meta.story({
  render: () => <WithErrorDemo />,
});

export const ReadOnly = meta.story({
  render: () => (
    <MatchScoreInput
      sets={completedSets}
      onChange={() => {}}
      readOnly
      player1Name="Max"
      player2Name="Anna"
    />
  ),
});
