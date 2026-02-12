"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

type RankDataPoint = {
  date: string;
  rank: number;
};

type RankChartProps = {
  data: RankDataPoint[];
  className?: string;
};

function RankChart({ data, className }: RankChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400",
          className,
        )}
      >
        Keine Rangdaten vorhanden
      </div>
    );
  }

  const maxRank = Math.max(...data.map((d) => d.rank));

  return (
    <div className={cn("h-48", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-slate-500"
          />
          <YAxis
            reversed
            domain={[1, maxRank]}
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-slate-500"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              fontSize: 12,
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number) => [`Rang ${value}`, "Rang"]}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ r: 4, fill: "#22C55E" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { RankChart };
export type { RankChartProps, RankDataPoint };
