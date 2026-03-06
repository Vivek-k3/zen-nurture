"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  ComposedChart,
  CartesianGrid,
} from "recharts";
import { getWHOPercentiles, ageInMonths, type Gender } from "@/lib/who-percentiles";

type Metric = "weight" | "length" | "head";

interface GrowthChartProps {
  events: Array<{
    timestamp: string;
    payload?: any;
  }>;
  dob: string;
  gender: Gender;
  metric: Metric;
}

const METRIC_CONFIG: Record<Metric, { key: string; unit: string; label: string; color: string }> = {
  weight: { key: "weightKg", unit: "kg", label: "Weight", color: "#7C9A82" },
  length: { key: "heightCm", unit: "cm", label: "Length", color: "#6B8CAE" },
  head:   { key: "headCm",   unit: "cm", label: "Head Circ.", color: "#C4A484" },
};

export default function GrowthChart({ events, dob, gender, metric }: GrowthChartProps) {
  const config = METRIC_CONFIG[metric];
  const percentiles = getWHOPercentiles(metric, gender);

  const data = useMemo(() => {
    const whoPoints = percentiles.map((p, month) => ({
      month,
      p3: p.p3,
      p15: p.p15,
      p50: p.p50,
      p85: p.p85,
      p97: p.p97,
      actual: undefined as number | undefined,
    }));

    const monthMap = new Map<number, typeof whoPoints[0]>();
    whoPoints.forEach((p) => monthMap.set(p.month, p));

    events.forEach((event) => {
      const val = event.payload?.[config.key];
      if (val == null || val === 0) return;
      const m = ageInMonths(dob, event.timestamp);
      const roundedMonth = Math.round(m * 10) / 10;

      const nearest = Math.round(m);
      const existing = monthMap.get(nearest);
      if (existing) {
        existing.actual = val;
      } else {
        const interp = interpolatePercentiles(percentiles, m);
        whoPoints.push({
          month: roundedMonth,
          ...interp,
          actual: val,
        });
      }
    });

    whoPoints.sort((a, b) => a.month - b.month);
    return whoPoints;
  }, [events, dob, percentiles, config.key]);

  const hasActualData = data.some((d) => d.actual !== undefined);

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: config.color }} />
          <h3 className="text-sm font-bold text-espresso">{config.label} for Age</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 bg-muted/30" /> WHO P3–P97
          </span>
          {hasActualData && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} /> Measured
            </span>
          )}
        </div>
      </div>

      <div className="h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis
              dataKey="month"
              type="number"
              domain={[0, 24]}
              ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
              tick={{ fontSize: 10, fill: "#6B6B6B" }}
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6B6B6B" }}
              tickFormatter={(v) => `${v}`}
              width={35}
            />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload?.length) return null;
                const row = payload[0]?.payload;
                return (
                  <div className="bg-white rounded-xl border border-muted/10 shadow-lg p-3 text-[11px]">
                    <p className="font-bold text-espresso mb-1">{typeof label === "number" ? `${label.toFixed(1)} months` : label}</p>
                    {row?.actual != null && (
                      <p style={{ color: config.color }} className="font-bold">
                        Measured: {row.actual} {config.unit}
                      </p>
                    )}
                    <p className="text-muted">P50: {row?.p50} {config.unit}</p>
                    <p className="text-muted">P3–P97: {row?.p3}–{row?.p97}</p>
                  </div>
                );
              }}
            />

            {/* P3–P97 band */}
            <Area dataKey="p97" stroke="none" fill="#7C9A82" fillOpacity={0.06} />
            <Area dataKey="p3" stroke="none" fill="#FEFCF8" fillOpacity={1} />

            {/* P15–P85 band */}
            <Area dataKey="p85" stroke="none" fill="#7C9A82" fillOpacity={0.08} />
            <Area dataKey="p15" stroke="none" fill="#FEFCF8" fillOpacity={1} />

            {/* Percentile lines */}
            <Line dataKey="p3" stroke="#d4d4d4" strokeWidth={1} dot={false} strokeDasharray="4 4" />
            <Line dataKey="p15" stroke="#c4c4c4" strokeWidth={1} dot={false} strokeDasharray="2 4" />
            <Line dataKey="p50" stroke="#a0a0a0" strokeWidth={1.5} dot={false} />
            <Line dataKey="p85" stroke="#c4c4c4" strokeWidth={1} dot={false} strokeDasharray="2 4" />
            <Line dataKey="p97" stroke="#d4d4d4" strokeWidth={1} dot={false} strokeDasharray="4 4" />

            {/* Actual data */}
            {hasActualData && (
              <Line
                dataKey="actual"
                stroke={config.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: config.color, stroke: "#fff", strokeWidth: 2 }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!hasActualData && (
        <p className="text-center text-xs text-muted mt-2">
          No measurements yet. Log growth in the Quick Logger to see data here.
        </p>
      )}
    </div>
  );
}
function interpolatePercentiles(percentiles: ReturnType<typeof getWHOPercentiles>, month: number) {
  const low = Math.floor(month);
  const high = Math.ceil(month);
  if (high >= percentiles.length) {
    const last = percentiles[percentiles.length - 1];
    return { p3: last.p3, p15: last.p15, p50: last.p50, p85: last.p85, p97: last.p97 };
  }
  if (low === high || low < 0) {
    const p = percentiles[Math.max(0, Math.min(low, percentiles.length - 1))];
    return { p3: p.p3, p15: p.p15, p50: p.p50, p85: p.p85, p97: p.p97 };
  }
  const frac = month - low;
  const a = percentiles[low];
  const b = percentiles[high];
  return {
    p3: round(a.p3 + (b.p3 - a.p3) * frac),
    p15: round(a.p15 + (b.p15 - a.p15) * frac),
    p50: round(a.p50 + (b.p50 - a.p50) * frac),
    p85: round(a.p85 + (b.p85 - a.p85) * frac),
    p97: round(a.p97 + (b.p97 - a.p97) * frac),
  };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

