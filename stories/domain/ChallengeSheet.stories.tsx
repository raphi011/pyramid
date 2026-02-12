"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, userEvent, expect, waitFor } from "storybook/test";
import { ChallengeSheet } from "@/components/domain/challenge-sheet";
import { Button } from "@/components/ui/button";
import { annaSchmidt, tomWeber } from "../__fixtures__";

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
        player={{ ...annaSchmidt, rank: 2 }}
        message={message}
        onMessageChange={setMessage}
      />
    </>
  );
}

export const Default = meta.story({
  render: () => <ChallengeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open sheet
    await userEvent.click(canvas.getByRole("button", { name: /herausfordern/i }));

    // Sheet should appear
    const dialog = await body.findByRole("dialog");
    const dialogScope = within(dialog);

    // Verify player info (use getAllByText to handle sr-only duplicates from Avatar)
    const nameElements = dialogScope.getAllByText("Anna Schmidt");
    await expect(nameElements.length).toBeGreaterThanOrEqual(1);
    await expect(dialogScope.getByText(/Rang 2/)).toBeInTheDocument();

    // Type a message
    const textarea = dialogScope.getByRole("textbox");
    await userEvent.type(textarea, "Samstag 14 Uhr?");
    await expect(textarea).toHaveValue("Samstag 14 Uhr?");

    // Submit
    const submitButtons = dialogScope.getAllByRole("button");
    const submitButton = submitButtons.find((b) => b.textContent?.includes("Herausfordern"));
    await userEvent.click(submitButton!);

    // Wait for transition to complete
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
});

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
        player={{ ...tomWeber, rank: 4 }}
        message={message}
        onMessageChange={setMessage}
      />
    </>
  );
}

export const WithMessage = meta.story({
  render: () => <WithMessageDemo />,
});
