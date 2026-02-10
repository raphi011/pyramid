"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ClubJoinCard } from "@/components/domain/club-join-card";

const meta: Meta = {
  title: "Domain/ClubJoinCard",
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const AdminView: Story = {
  render: () => (
    <ClubJoinCard
      mode="admin"
      clubCode="ABC123"
      onCopy={() => {}}
      onShare={() => {}}
    />
  ),
};

export const PlayerView: Story = {
  render: () => {
    const [code, setCode] = useState("");
    return (
      <ClubJoinCard
        mode="player"
        code={code}
        onCodeChange={setCode}
        onJoin={() => {}}
      />
    );
  },
};

export const PlayerWithError: Story = {
  render: () => {
    const [code, setCode] = useState("XYZ999");
    return (
      <ClubJoinCard
        mode="player"
        code={code}
        onCodeChange={setCode}
        onJoin={() => {}}
        error="Ungültiger Einladungscode."
      />
    );
  },
};
