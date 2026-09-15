"use client";

import {
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { StatusCue, type StatusTone } from "@/components/ui/status-chip";

interface FleetStatusChartProps {
  activeVehicles: number;
  offlineVehicles: number;
  idleVehicles: number;
}

// Index-aligned with `data` below: [Moving, Offline, Idle]. Recharts takes an SVG fill
// attribute rather than a class, so these read the tokens directly: the same tokens the
// legend cues resolve to, which is what keeps a segment and its own legend entry identical.
const COLORS = [
  "var(--status-ok)",
  "var(--status-fault)",
  "var(--status-attn)",
];

// Same order, for the legend. Every segment touches every other in a three-part ring, and
// Idle (amber) and Offline (red) measure only dE 4.4 apart under deuteranopia, so colour
// cannot carry identity here: the legend adds each tone's shape, its label and its count.
const TONES: StatusTone[] = ["ok", "fault", "attn"];

// StatusCue paints with `currentColor`; full literals so Tailwind generates them.
const CUE_COLOR: Record<StatusTone, string> = {
  signal: "text-status-signal",
  ok: "text-status-ok",
  attn: "text-status-attn",
  fault: "text-status-fault",
  neutral: "text-status-neutral",
};

export default function FleetStatusChart({
  activeVehicles,
  offlineVehicles,
  idleVehicles,
}: FleetStatusChartProps) {
  const data = [
    {
      name: "Moving",
      value: activeVehicles,
    },

    {
      name: "Offline",
      value: offlineVehicles,
    },

    {
      name: "Idle",
      value: idleVehicles,
    },
  ];

  const total = activeVehicles + offlineVehicles + idleVehicles;

  return (
    <div className="h-full rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="section-title text-foreground">
          Fleet Status
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Real-time status breakdown</p>
      </div>

      {/* Ring and legend sit side by side wherever the panel runs full width (sm to lg), and
          stack when it narrows to a third of the row at xl. */}
      <div className="flex flex-col items-center gap-6 p-4 sm:flex-row sm:justify-center xl:flex-col">
        <div className="relative h-[220px] w-[220px] shrink-0">
          <PieChart
            width={220}
            height={220}
          >
            <Pie
              data={data}
              innerRadius={68}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[index]
                    }
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ),
              )}
            </Pie>
          </PieChart>

          {/* Centered details overlay. Proportional figures on a standalone value. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold leading-none tracking-tight text-foreground">{total}</span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
          </div>
        </div>

        {/* LEGEND: a small ledger. Counts share a right-aligned tabular column. */}
        <ul className="w-full max-w-[16rem] space-y-2.5">
          {data.map((entry, index) => (
            <li
              key={entry.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <StatusCue
                  tone={TONES[index]}
                  className={CUE_COLOR[TONES[index]]}
                />
                {entry.name}
              </span>

              <span className="font-semibold tabular-nums text-foreground">
                {entry.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
