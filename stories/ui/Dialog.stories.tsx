import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

function SimpleDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Dialog öffnen</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Bestätigung">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Möchtest du diese Aktion wirklich ausführen?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={() => setOpen(false)}>Bestätigen</Button>
        </div>
      </Dialog>
    </>
  );
}

export const Simple: Story = {
  render: () => <SimpleDialogDemo />,
};

function FormDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Mit Formular</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Spieler einladen">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" required>Name</Label>
            <Input id="name" placeholder="Max Mustermann" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" required>E-Mail</Label>
            <Input id="email" type="email" placeholder="max@example.com" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={() => setOpen(false)}>Einladen</Button>
        </div>
      </Dialog>
    </>
  );
}

export const WithForm: Story = {
  render: () => <FormDialogDemo />,
};
