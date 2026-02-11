"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ChallengeSheet } from "@/components/domain/challenge-sheet";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof ChallengeSheet> = {
  title: "Domain/ChallengeSheet",
  component: ChallengeSheet,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ChallengeSheet>;

function ChallengeDemo() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <>
      <Button onClick={() => setOpen(true)}>Herausfordern</Button>
      <ChallengeSheet
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={() => setOpen(false)}
        player={{ name: "Anna Schmidt", rank: 2 }}
        message={message}
        onMessageChange={setMessage}
      />
    </>
  );
}

export const Default: Story = {
  render: () => <ChallengeDemo />,
};

function WithMessageDemo() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Hast du am Samstag Zeit?");
  return (
    <>
      <Button onClick={() => setOpen(true)}>Mit Nachricht</Button>
      <ChallengeSheet
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={() => setOpen(false)}
        player={{ name: "Tom Weber", rank: 4 }}
        message={message}
        onMessageChange={setMessage}
      />
    </>
  );
}

export const WithMessage: Story = {
  render: () => <WithMessageDemo />,
};
