import { useState } from "react";
import preview from "#.storybook/preview";
import { Calendar } from "@/components/ui/calendar";

const meta = preview.meta({
  title: "UI/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

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

export const Default = meta.story({
  render: () => <CalendarDemo />,
});

export const WithPreselected = meta.story({
  render: () => {
    const today = new Date();
    return <Calendar value={today} />;
  },
});
