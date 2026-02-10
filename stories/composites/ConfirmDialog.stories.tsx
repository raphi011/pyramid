"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
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
