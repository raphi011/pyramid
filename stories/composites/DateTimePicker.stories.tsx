"use client";

import { useState } from "react";
import preview from "#.storybook/preview";
import { within, userEvent, expect } from "storybook/test";
import { DateTimePicker } from "@/components/date-time-picker";

const meta = preview.meta({
  title: "Extended/DateTimePicker",
  component: DateTimePicker,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

function DateOnlyDemo() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  return <DateTimePicker value={date} onChange={setDate} />;
}

export const DateOnly = meta.story({
  render: () => <DateOnlyDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Click trigger to open popover
    const trigger = canvas.getByRole("button", { name: /datum wählen/i });
    await userEvent.click(trigger);

    // Calendar should appear — month header visible in popover
    const monthHeader = await body.findByText(
      /Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember/,
    );
    await expect(monthHeader).toBeInTheDocument();
  },
});

function DateTimeDemo() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  return <DateTimePicker value={date} onChange={setDate} showTime />;
}

export const DateTime = meta.story({
  render: () => <DateTimeDemo />,
});

function WithPreselectedDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <DateTimePicker value={date} onChange={setDate} showTime />;
}

export const WithPreselected = meta.story({
  render: () => <WithPreselectedDemo />,
});
