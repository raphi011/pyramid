"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, userEvent, expect } from "storybook/test";
import { DateTimePicker } from "@/components/date-time-picker";

const meta: Meta<typeof DateTimePicker> = {
  title: "Extended/DateTimePicker",
  component: DateTimePicker,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DateTimePicker>;

function DateOnlyDemo() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  return <DateTimePicker value={date} onChange={setDate} />;
}

export const DateOnly: Story = {
  render: () => <DateOnlyDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Click trigger to open popover
    const trigger = canvas.getByRole("button", { name: /datum wählen/i });
    await userEvent.click(trigger);

    // Calendar should appear — month header visible in popover
    const monthHeader = await body.findByText(/Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember/);
    await expect(monthHeader).toBeInTheDocument();
  },
};

function DateTimeDemo() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  return <DateTimePicker value={date} onChange={setDate} showTime />;
}

export const DateTime: Story = {
  render: () => <DateTimeDemo />,
};

export const WithPreselected: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <DateTimePicker value={date} onChange={setDate} showTime />;
  },
};
