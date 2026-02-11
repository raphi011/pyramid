"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CharacterInput } from "@/components/ui/character-input";

const meta: Meta<typeof CharacterInput> = {
  title: "Extended/CharacterInput",
  component: CharacterInput,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof CharacterInput>;

function Demo({ length, initial = "" }: { length?: number; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="space-y-2">
      <CharacterInput length={length} value={value} onChange={setValue} />
      <p className="text-center text-xs text-slate-500">Wert: "{value}"</p>
    </div>
  );
}

export const Empty: Story = {
  render: () => <Demo />,
};

export const PartialFill: Story = {
  render: () => <Demo initial="AB" />,
};

export const Full: Story = {
  render: () => <Demo initial="ABC123" />,
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState("XYZ99");
    return <CharacterInput value={value} onChange={setValue} error />;
  },
};

export const FourCharacters: Story = {
  render: () => <Demo length={4} />,
};

export const EightCharacters: Story = {
  render: () => <Demo length={8} />,
};
