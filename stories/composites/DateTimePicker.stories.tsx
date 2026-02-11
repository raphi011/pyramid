"use client";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DateTimePicker } from "@/components/date-time-picker";

const meta: Meta<typeof DateTimePicker> = {
  title: "Extended/DateTimePicker",
  component: DateTimePicker,
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
