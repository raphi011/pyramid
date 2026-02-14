"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import {
  ChallengeSheet,
  type Opponent,
} from "@/components/domain/challenge-sheet";
import { Button } from "@/components/ui/button";

const opponents: Opponent[] = [
  { teamId: 1, name: "Julia Fischer", rank: 1 },
  { teamId: 2, name: "Anna Schmidt", rank: 2 },
  { teamId: 4, name: "Lisa Müller", rank: 4 },
];

const meta = preview.meta({
  title: "Domain/ChallengeSheet",
  component: ChallengeSheet,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "iPhoneSE" },
  },
});

export default meta;

function DirectChallengeDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Herausfordern</Button>
      <ChallengeSheet
        open={open}
        onClose={() => setOpen(false)}
        target={opponents[1]}
        opponents={opponents}
        seasonId={1}
      />
    </>
  );
}

export const DirectChallenge = meta.story({
  render: () => <DirectChallengeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open sheet
    await userEvent.click(
      canvas.getByRole("button", { name: /herausfordern/i }),
    );

    // Sheet should appear with confirm step (direct target)
    const dialog = await body.findByRole("dialog");
    const dialogScope = within(dialog);

    // Verify opponent info
    const nameElements = dialogScope.getAllByText("Anna Schmidt");
    await expect(nameElements.length).toBeGreaterThanOrEqual(1);
    await expect(dialogScope.getByText(/Rang 2/)).toBeInTheDocument();

    // Type a message
    const textarea = dialogScope.getByRole("textbox");
    await userEvent.type(textarea, "Samstag 14 Uhr?");
    await expect(textarea).toHaveValue("Samstag 14 Uhr?");
  },
});

function PickOpponentDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Gegner wählen</Button>
      <ChallengeSheet
        open={open}
        onClose={() => setOpen(false)}
        opponents={opponents}
        seasonId={1}
      />
    </>
  );
}

export const PickOpponent = meta.story({
  render: () => <PickOpponentDemo />,
});

function WithSeasonSelectDemo() {
  const [open, setOpen] = useState(false);
  const seasons = [
    { id: 1, name: "Sommer 2026" },
    { id: 2, name: "Winter 2025" },
  ];
  return (
    <>
      <Button onClick={() => setOpen(true)}>Mit Saison</Button>
      <ChallengeSheet
        open={open}
        onClose={() => setOpen(false)}
        opponents={opponents}
        seasonId={1}
        seasons={seasons}
      />
    </>
  );
}

export const WithSeasonSelect = meta.story({
  render: () => <WithSeasonSelectDemo />,
});

function EmptyOpponentsDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Keine Gegner</Button>
      <ChallengeSheet
        open={open}
        onClose={() => setOpen(false)}
        opponents={[]}
        seasonId={1}
      />
    </>
  );
}

export const EmptyOpponents = meta.story({
  render: () => <EmptyOpponentsDemo />,
});
