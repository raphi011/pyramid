"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";

const meta: Meta<typeof ResponsiveDialog> = {
  title: "Composites/ResponsiveDialog",
  component: ResponsiveDialog,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ResponsiveDialog>;

function SimpleDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Dialog öffnen</Button>
      <ResponsiveDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Spieler einladen"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Teile den Einladungscode mit deinen Vereinsmitgliedern.
        </p>
        <div className="mt-4">
          <Button className="w-full" onClick={() => setOpen(false)}>
            Schließen
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}

export const Default: Story = {
  render: () => <SimpleDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open dialog
    await userEvent.click(canvas.getByRole("button", { name: /dialog öffnen/i }));

    // Verify title is visible
    const dialog = await body.findByRole("dialog");
    const dialogScope = within(dialog);
    await expect(dialogScope.getByText("Spieler einladen")).toBeInTheDocument();

    // Close
    await userEvent.click(dialogScope.getByRole("button", { name: /schließen/i }));
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

function WithFormDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Mit Formular</Button>
      <ResponsiveDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Ergebnis eintragen"
      >
        <div className="space-y-4">
          <FormField label="Satz 1" placeholder="6:4" />
          <FormField label="Satz 2" placeholder="3:6" />
          <FormField label="Satz 3" placeholder="7:5" />
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Speichern
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}

export const WithForm: Story = {
  render: () => <WithFormDemo />,
};
