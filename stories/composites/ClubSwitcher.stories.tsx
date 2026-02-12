"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { fn, within, userEvent, expect } from "storybook/test";
import { ClubSwitcher } from "@/components/club-switcher";

const meta = preview.meta({
  title: "Extended/ClubSwitcher",
  component: ClubSwitcher,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const SingleClub = meta.story({
  args: {
    clubs: [{ id: "1", name: "TC Musterstadt" }],
    activeClubId: "1",
    onSwitch: fn(),
  },
});

function MultiClubDemo() {
  const [active, setActive] = useState<string | number>("1");
  const clubs = [
    { id: "1", name: "TC Musterstadt" },
    { id: "2", name: "TC Beispielburg" },
    { id: "3", name: "TC Testheim" },
  ];
  return (
    <div className="w-56">
      <ClubSwitcher clubs={clubs} activeClubId={active} onSwitch={setActive} />
    </div>
  );
}

export const MultipleClubs = meta.story({
  render: () => <MultiClubDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Open the switcher
    await userEvent.click(canvas.getByRole("button"));

    // Other clubs should appear in the dropdown
    const items = await body.findAllByRole("menuitem");
    await expect(items.length).toBe(3);

    // Select a different club (click the menuitem, not text, to avoid sr-only duplicates)
    await userEvent.click(items[1]);
  },
});
