"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TrendsChartsProps {
  rangeAggregates: Record<string, any> | null;
  days: number;
}

export default function TrendsCharts({ rangeAggregates, days }: TrendsChartsProps) {
  const data = useMemo(() => {
    if (!rangeAggregates) return [];

    const today = new Date();
    const rows = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const agg = rangeAggregates[key];

      rows.push({
        date: key,
        label: formatLabel(d, days),
        feedCount: agg?.feeds?.count ?? 0,
        feedMl: agg?.feeds?.totalMl ?? 0,
        diaperCount: agg?.diapers?.count ?? 0,
        diaperWet: agg?.diapers?.wet ?? 0,
        diaperDirty: agg?.diapers?.dirty ?? 0,
        diaperDry: agg?.diapers?.dry ?? 0,
        diaperMixed: agg?.diapers?.mixed ?? 0,
        sleepHours: Math.round(((agg?.sleeps?.totalMin ?? 0) / 60) * 10) / 10,
        medsTaken: agg?.meds?.taken ?? 0,
        medsSkipped: agg?.meds?.skipped ?? 0,
      });
    }

    return rows;
  }, [rangeAggregates, days]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
        <p className="text-muted">No data for this period</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Feed Volume */}
      <ChartCard
        title="Feed Volume"
        subtitle="Daily ml intake"
        color="#7C9A82"
        icon="water_drop"
      >
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="feedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C9A82" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7C9A82" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B6B6B" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} width={35} />
            <Tooltip content={<ChartTooltip unit="ml" field="feedMl" secondaryField="feedCount" secondaryLabel="feeds" />} />
            <Area type="monotone" dataKey="feedMl" stroke="#7C9A82" strokeWidth={2} fill="url(#feedGrad)" dot={{ r: 3, fill: "#7C9A82", stroke: "#fff", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Feed Count */}
      <ChartCard
        title="Feed Count"
        subtitle="Number of feeds per day"
        color="#7C9A82"
        icon="restaurant"
      >
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B6B6B" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} width={25} allowDecimals={false} />
            <Tooltip content={<ChartTooltip unit="" field="feedCount" />} />
            <Bar dataKey="feedCount" fill="#7C9A82" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Diapers */}
      <ChartCard
        title="Diapers"
        subtitle="Daily diaper changes"
        color="#C4A484"
        icon="baby_changing_station"
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B6B6B" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} width={25} allowDecimals={false} />
            <Tooltip content={<DiaperTooltip />} />
            <Bar dataKey="diaperWet" stackId="diaper" fill="#6B8CAE" radius={[0, 0, 0, 0]} maxBarSize={32} name="Wet" />
            <Bar dataKey="diaperDirty" stackId="diaper" fill="#C4A484" radius={[0, 0, 0, 0]} maxBarSize={32} name="Dirty" />
            <Bar dataKey="diaperDry" stackId="diaper" fill="#9CA3AF" radius={[0, 0, 0, 0]} maxBarSize={32} name="Dry" />
            <Bar dataKey="diaperMixed" stackId="diaper" fill="#A78BFA" radius={[4, 4, 0, 0]} maxBarSize={32} name="Mixed" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center gap-3 mt-2 px-1">
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <span className="inline-block h-2 w-2 rounded-sm bg-[#6B8CAE]" /> Wet
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <span className="inline-block h-2 w-2 rounded-sm bg-[#C4A484]" /> Dirty
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <span className="inline-block h-2 w-2 rounded-sm bg-[#9CA3AF]" /> Dry
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <span className="inline-block h-2 w-2 rounded-sm bg-[#A78BFA]" /> Mixed
          </span>
        </div>
      </ChartCard>

      {/* Sleep */}
      <ChartCard
        title="Sleep Duration"
        subtitle="Hours of sleep per day"
        color="#1E293B"
        icon="bedtime"
      >
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E293B" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#1E293B" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B6B6B" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} width={30} />
            <Tooltip content={<ChartTooltip unit="h" field="sleepHours" />} />
            <Area type="monotone" dataKey="sleepHours" stroke="#1E293B" strokeWidth={2} fill="url(#sleepGrad)" dot={{ r: 3, fill: "#1E293B", stroke: "#fff", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Meds Adherence */}
      <ChartCard
        title="Medicine"
        subtitle="Taken vs skipped per day"
        color="#E57373"
        icon="medication"
      >
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#6B6B6B" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} width={25} allowDecimals={false} />
            <Tooltip content={<MedsTooltip />} />
            <Bar dataKey="medsTaken" stackId="meds" fill="#7C9A82" radius={[0, 0, 0, 0]} maxBarSize={32} />
            <Bar dataKey="medsSkipped" stackId="meds" fill="#E57373" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 px-1">
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <span className="inline-block h-2 w-2 rounded-sm bg-[#7C9A82]" /> Taken
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <span className="inline-block h-2 w-2 rounded-sm bg-[#E57373]" /> Skipped
          </span>
        </div>
      </ChartCard>
    </div>
  );
}

/* ---- Chart Card wrapper ---- */

function ChartCard({ title, subtitle, color, icon, children }: {
  title: string; subtitle: string; color: string; icon: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
        <div>
          <h3 className="text-sm font-bold text-espresso">{title}</h3>
          <p className="text-[10px] text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ---- Tooltips ---- */

function ChartTooltip({ active, payload, label, unit, field, secondaryField, secondaryLabel }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="bg-white rounded-xl border border-muted/10 shadow-lg p-3 text-[11px]">
      <p className="font-bold text-espresso mb-1">{row?.date}</p>
      <p className="text-espresso font-mono">{row?.[field]}{unit}</p>
      {secondaryField && (
        <p className="text-muted">{row?.[secondaryField]} {secondaryLabel}</p>
      )}
    </div>
  );
}

function DiaperTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const parts = [];
  if (row?.diaperWet) parts.push(`${row.diaperWet} wet`);
  if (row?.diaperDirty) parts.push(`${row.diaperDirty} dirty`);
  if (row?.diaperDry) parts.push(`${row.diaperDry} dry`);
  if (row?.diaperMixed) parts.push(`${row.diaperMixed} mixed`);
  return (
    <div className="bg-white rounded-xl border border-muted/10 shadow-lg p-3 text-[11px]">
      <p className="font-bold text-espresso mb-1">{row?.date}</p>
      <p className="text-espresso">{row?.diaperCount} total</p>
      {parts.length > 0 && <p className="text-muted">{parts.join(" · ")}</p>}
    </div>
  );
}

function MedsTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="bg-white rounded-xl border border-muted/10 shadow-lg p-3 text-[11px]">
      <p className="font-bold text-espresso mb-1">{row?.date}</p>
      <p className="text-sage">{row?.medsTaken} taken</p>
      {row?.medsSkipped > 0 && <p className="text-alert-red">{row?.medsSkipped} skipped</p>}
    </div>
  );
}

/* ---- Helpers ---- */

function formatLabel(d: Date, totalDays: number) {
  if (totalDays <= 7) {
    return d.toLocaleDateString("en-IN", { weekday: "short" });
  }
  if (totalDays <= 14) {
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
