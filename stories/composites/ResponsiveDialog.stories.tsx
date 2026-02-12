"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, userEvent, expect, waitFor } from "storybook/test";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form-field";

const meta = preview.meta({
  title: "Composites/ResponsiveDialog",
  component: ResponsiveDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "iPhoneSE" },
  },
});

export default meta;

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

export const Default = meta.story({
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

    // Close via the visible "Schließen" button (not the sr-only X button)
    const buttons = dialogScope.getAllByRole("button", { name: /schließen/i });
    const visibleClose = buttons.find((b) => b.textContent?.trim() === "Schließen");
    await userEvent.click(visibleClose!);

    // Wait for Headless UI transition to complete
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
});

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

export const WithForm = meta.story({
  render: () => <WithFormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open the dialog
    await userEvent.click(canvas.getByRole("button", { name: /mit formular/i }));

    // Wait for dialog to appear
    const dialog = await body.findByRole("dialog");
    const dialogScope = within(dialog);

    // Verify title
    await expect(dialogScope.getByText("Ergebnis eintragen")).toBeInTheDocument();

    // Fill the form fields
    const inputs = dialogScope.getAllByRole("textbox");
    await userEvent.type(inputs[0], "6:4");
    await userEvent.type(inputs[1], "3:6");
    await userEvent.type(inputs[2], "7:5");

    // Click "Speichern" to submit and close
    await userEvent.click(dialogScope.getByRole("button", { name: /speichern/i }));

    // Dialog should close
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
});
