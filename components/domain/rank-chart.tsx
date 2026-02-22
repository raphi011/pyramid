"use client";

import { useEffect, useRef, useState } from "react";
import {
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
  matchId?: number;
};

type RankChartProps = {
  data: RankDataPoint[];
  emptyLabel: string;
  tooltipLabel: string;
  onDotClick?: (matchId: number) => void;
  className?: string;
};

function RankChart({
  data,
  emptyLabel,
  tooltipLabel,
  onDotClick,
  className,
}: RankChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(el.classList.contains("dark"));
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400",
          className,
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  const maxRank = Math.max(...data.map((d) => d.rank));
  // Generate integer ticks from 1 to maxRank
  const yTicks = Array.from({ length: maxRank }, (_, i) => i + 1);

  const tickColor = isDark ? "#94a3b8" : "#64748b"; // slate-400 / slate-500
  const gridColor = isDark ? "#334155" : "#e2e8f0"; // slate-700 / slate-200
  const axisColor = isDark ? "#475569" : "#cbd5e1"; // slate-600 / slate-300

  return (
    <div ref={ref} className={cn("h-48", className)}>
      {size.width > 0 && size.height > 0 && (
        <LineChart
          width={size.width}
          height={size.height}
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: tickColor }}
            stroke={axisColor}
          />
          <YAxis
            reversed
            domain={[1, maxRank]}
            ticks={yTicks}
            tick={{ fontSize: 11, fill: tickColor }}
            stroke={axisColor}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              fontSize: 12,
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              color: isDark ? "#e2e8f0" : "#0f172a",
            }}
            formatter={(value) => [value, tooltipLabel] as [string, string]}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ r: 4, fill: "#22C55E" }}
            activeDot={{
              r: 6,
              cursor: onDotClick ? "pointer" : undefined,
              onClick: onDotClick
                ? (_: unknown, payload: { payload?: RankDataPoint }) => {
                    const matchId = payload?.payload?.matchId;
                    if (matchId) onDotClick(matchId);
                  }
                : undefined,
            }}
          />
        </LineChart>
      )}
    </div>
  );
}

export { RankChart };
export type { RankChartProps, RankDataPoint };
