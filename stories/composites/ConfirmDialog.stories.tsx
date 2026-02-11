"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof ConfirmDialog> = {
  title: "Composites/ConfirmDialog",
  component: ConfirmDialog,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

function DestructiveDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Spieler entfernen
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="Spieler entfernen?"
        description="Möchtest du Max Mustermann wirklich aus der Saison entfernen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Entfernen"
      />
    </>
  );
}

export const Destructive: Story = {
  render: () => <DestructiveDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Click trigger button
    await userEvent.click(canvas.getByRole("button", { name: /spieler entfernen/i }));

    // Dialog should appear (portaled to body)
    const dialog = await body.findByRole("dialog");
    const dialogScope = within(dialog);

    // Verify dialog content
    await expect(dialogScope.getByText("Spieler entfernen?")).toBeInTheDocument();
    await expect(dialogScope.getByText(/Max Mustermann/)).toBeInTheDocument();

    // Click cancel to close
    await userEvent.click(dialogScope.getByRole("button", { name: /abbrechen/i }));

    // Dialog should be gone
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

function WithCustomLabelsDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Herausforderung zurückziehen
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="Herausforderung zurückziehen?"
        description="Willst du die Herausforderung an Anna Schmidt wirklich zurückziehen?"
        confirmLabel="Zurückziehen"
        cancelLabel="Doch nicht"
      />
    </>
  );
}

export const WithCustomLabels: Story = {
  render: () => <WithCustomLabelsDemo />,
};
