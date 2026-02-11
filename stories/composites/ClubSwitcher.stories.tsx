"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ClubSwitcher } from "@/components/club-switcher";

const meta: Meta<typeof ClubSwitcher> = {
  title: "Extended/ClubSwitcher",
  component: ClubSwitcher,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ClubSwitcher>;

export const SingleClub: Story = {
  args: {
    clubs: [{ id: "1", name: "TC Musterstadt" }],
    activeClubId: "1",
    onSwitch: () => {},
  },
};

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

export const MultipleClubs: Story = {
  render: () => <MultiClubDemo />,
};
