import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@/components/ui/calendar";

const meta: Meta<typeof Calendar> = {
  title: "UI/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  return (
    <div>
      <Calendar value={date} onChange={setDate} />
      {date && (
        <p className="mt-3 text-sm text-slate-500">
          Gewählt: {date.toLocaleDateString("de-DE")}
        </p>
      )}
    </div>
  );
}

export const Default: Story = {
  render: () => <CalendarDemo />,
};

export const WithPreselected: Story = {
  render: () => {
    const today = new Date();
    return <Calendar value={today} />;
  },
};
