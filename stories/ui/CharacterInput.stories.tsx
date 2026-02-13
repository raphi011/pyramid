"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { CharacterInput } from "@/components/ui/character-input";

const meta = preview.meta({
  title: "Extended/CharacterInput",
  component: CharacterInput,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

function Demo({ length, initial = "" }: { length?: number; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="space-y-2">
      <CharacterInput length={length} value={value} onChange={setValue} />
      <p className="text-center text-xs text-slate-500">Wert: &quot;{value}&quot;</p>
    </div>
  );
}

export const Empty = meta.story({
  render: () => <Demo />,
});

export const PartialFill = meta.story({
  render: () => <Demo initial="AB" />,
});

export const Full = meta.story({
  render: () => <Demo initial="ABC123" />,
});

function WithErrorDemo() {
  const [value, setValue] = useState("XYZ99");
  return <CharacterInput value={value} onChange={setValue} error />;
}

export const WithError = meta.story({
  render: () => <WithErrorDemo />,
});

export const FourCharacters = meta.story({
  render: () => <Demo length={4} />,
});

export const EightCharacters = meta.story({
  render: () => <Demo length={8} />,
});
