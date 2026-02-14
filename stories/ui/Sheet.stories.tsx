import { useState } from "react";
import preview from "#.storybook/preview";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const meta = preview.meta({
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: {
      options: {
        iPhoneSE: {
          name: "iPhone SE",
          styles: { width: "375px", height: "667px" },
        },
      },
    },
  },
});

export default meta;

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Sheet öffnen</Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Forderung senden"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Möchtest du diesen Spieler herausfordern? Du kannst eine optionale
          Nachricht hinzufügen.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button onClick={() => setOpen(false)} className="flex-1">
            Fordern
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export const Default = meta.story({
  render: () => <SheetDemo />,
});
