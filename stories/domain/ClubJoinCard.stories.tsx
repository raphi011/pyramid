"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { fn, within, userEvent, expect } from "storybook/test";
import { ClubJoinCard } from "@/components/domain/club-join-card";

const meta = preview.meta({
  title: "Domain/ClubJoinCard",
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const AdminView = meta.story({
  render: () => (
    <ClubJoinCard mode="admin" clubCode="ABC123" onCopy={fn()} onShare={fn()} />
  ),
});

function PlayerViewDemo() {
  const [code, setCode] = useState("");
  return (
    <ClubJoinCard
      mode="player"
      code={code}
      onCodeChange={setCode}
      onJoin={fn()}
    />
  );
}

export const PlayerView = meta.story({
  render: () => <PlayerViewDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Join button should be disabled initially (empty code)
    const joinButton = canvas.getByRole("button", { name: /beitreten/i });
    await expect(joinButton).toBeDisabled();

    // Type a 6-char code
    const input = canvas.getByPlaceholderText(/code eingeben/i);
    await userEvent.type(input, "ABC123");

    // Join button should now be enabled
    await expect(joinButton).toBeEnabled();
  },
});

function PlayerWithErrorDemo() {
  const [code, setCode] = useState("XYZ999");
  return (
    <ClubJoinCard
      mode="player"
      code={code}
      onCodeChange={setCode}
      onJoin={fn()}
      error="Ungültiger Einladungscode."
    />
  );
}

export const PlayerWithError = meta.story({
  render: () => <PlayerWithErrorDemo />,
});
