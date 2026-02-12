"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";

type CalendarProps = {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
};

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getStartPadding(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-based: Mon=0, Tue=1, ..., Sun=6
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function Calendar({ value, onChange, className }: CalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(value || today);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = getDaysInMonth(year, month);
  const padding = getStartPadding(year, month);

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className={cn("w-72 select-none", className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          aria-label="Vorheriger Monat"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Nächster Monat"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <ChevronRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* Day names */}
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
        {DAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells for padding */}
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const isSelected = value && isSameDay(day, value);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.getDate()}
              onClick={() => onChange?.(day)}
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-xl text-sm",
                "transition-colors duration-100",
                isSelected
                  ? "bg-court-500 font-semibold text-white"
                  : isToday
                    ? "font-semibold text-court-600 dark:text-court-400"
                    : "text-slate-700 hover:bg-court-50 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
export type { CalendarProps };
