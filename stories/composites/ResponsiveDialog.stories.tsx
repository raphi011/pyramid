"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
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
