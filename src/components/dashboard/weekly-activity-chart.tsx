"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { useEffect, useState } from "react";

import { WeeklyActivityDay } from "@/types/trip";

interface WeeklyActivityChartProps {
  /**
   * The last 7 days, oldest → newest, already bucketed and zero-filled by the server
   * (DSH-05). Rendered as-is — a day with no trips is a real 0, not a gap.
   */
  days: WeeklyActivityDay[];
}

// Axis text is chart chrome: recessive, and in a text token rather than the series hue.
const AXIS_TICK = { fontSize: 12, fill: "var(--muted-foreground)" };

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string }; value: number }>;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
        <p className="text-xs font-medium text-muted-foreground">
          {payload[0].payload.label}
        </p>

        {/* The value leads and the label follows: the reader already knows the series. The
            short stroke is its key, a line rather than a filled box at tooltip density. */}
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold tabular-nums text-foreground">
          <span aria-hidden className="inline-block h-0.5 w-3 rounded-full bg-primary" />
          {payload[0].value} Scheduled Trips
        </p>
      </div>
    );
  }

  return null;
};

export default function WeeklyActivityChart({
  days,
}: WeeklyActivityChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="section-title text-foreground">
          Weekly Activity
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">Scheduled trips over the last 7 days</p>
      </div>

      {/* Padding lives on this wrapper, not on the fixed-height box below: the chart is 240px
          tall and the box must be too, or the x-axis band would overflow into a nested scroll. */}
      <div className="p-4">
        <div className="h-[240px] w-full min-h-0 min-w-0">
          {mounted && (
            <ResponsiveContainer
              width="99%"
              height={240}
            >
              <AreaChart
                data={days}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                {/* A solid hairline. A dashed grid reads as a projection or a threshold. */}
                <CartesianGrid
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tick={AXIS_TICK}
                />

                {/* The y-axis is what makes a value readable without hovering, so the tooltip
                    enhances rather than gates. Tabular figures: ticks align in a column. */}
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tick={{ ...AXIS_TICK, style: { fontVariantNumeric: "tabular-nums" } }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  // Flat wash instead of the old gradient. 0.12 keeps the fill below the
                  // gridline (1.23:1 vs 1.74:1 on card) so it reads as area, not as a block.
                  fill="var(--primary)"
                  fillOpacity={0.12}
                  dot={false}
                  // An 8px marker with a 2px ring in the card colour, so it stays legible
                  // where it sits on the line.
                  activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
