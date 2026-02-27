"use client";

import { useState, useEffect, useTransition, useMemo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDuration } from "@/lib/time";
import GrowthChart from "@/components/GrowthChart";
const TrendsCharts = dynamic(
  () => import("@/components/TrendsCharts"),
  { ssr: false }
);
const TrendsCalendar = dynamic(
  () => import("@/components/TrendsCalendar"),
  { ssr: false }
);
import WeeklyDigestCard from "@/components/WeeklyDigestCard";
import type { Gender } from "@/lib/who-percentiles";
import { useBaby } from "@/components/BabyContext";
import { DataState } from "@/components/DataState";
import {
  AppSelectTriggerCompact,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type TrendsTab = "24h" | "7d" | "14d" | "30d" | "growth" | "calendar";
type DiaperKindFilter = "all" | "wet" | "dirty" | "dry" | "mixed";
type DiaperTextureFilter = "all" | "runny" | "mucousy" | "mushy" | "solid" | "pebbles";
type DiaperColorFilter = "all" | "black" | "green" | "yellow" | "brown" | "red" | "gray";

function FilterChip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-medium text-muted uppercase tracking-wide shrink-0">{label}</span>
      {children}
    </div>
  );
}

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState<TrendsTab>("24h");
  const [isPending, startTransition] = useTransition();
  const [diaperKindFilter, setDiaperKindFilter] = useState<DiaperKindFilter>("all");
  const [diaperTextureFilter, setDiaperTextureFilter] = useState<DiaperTextureFilter>("all");
  const [diaperColorFilter, setDiaperColorFilter] = useState<DiaperColorFilter>("all");
  const [blowoutOnly, setBlowoutOnly] = useState(false);
  const [rashOnly, setRashOnly] = useState(false);
  const [formulaFilter, setFormulaFilter] = useState<string>("all");
  const [feedContentFilter, setFeedContentFilter] = useState<string>("all");
  const [medicineFilter, setMedicineFilter] = useState<string>("all");
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { activeBaby: babyProfile, activeBabyId: babyId } = useBaby();
  const todayStr = useMemo(() => new Date(nowMs).toISOString().split("T")[0], [nowMs]);
  const rangeDays = timeRange === "14d" ? 14 : timeRange === "30d" ? 30 : 7;
  const rangeStartISO = useMemo(
    () => new Date(nowMs - (rangeDays - 1) * 24 * 60 * 60 * 1000).toISOString(),
    [rangeDays, nowMs]
  );
  const weekAgoISO = useMemo(() => new Date(nowMs - 6 * 24 * 60 * 60 * 1000).toISOString(), [nowMs]);
  const nowISO = useMemo(() => new Date(nowMs).toISOString(), [nowMs]);

  const sixtyDaysAgo = useMemo(() => new Date(nowMs - 59 * 24 * 60 * 60 * 1000).toISOString(), [nowMs]);
  const formulasUsed = useQuery(
    api.events.getFormulasUsedByBaby,
    babyId ? { babyId, from: sixtyDaysAgo } : "skip"
  );
  const medicinesUsed = useQuery(
    api.events.getMedicinesUsedByBaby,
    babyId ? { babyId, from: sixtyDaysAgo } : "skip"
  );

  const aggFilters = useMemo(
    () => ({
      ...(formulaFilter !== "all" && { formulaName: formulaFilter }),
      ...(feedContentFilter !== "all" && { feedContentType: feedContentFilter }),
      ...(medicineFilter !== "all" && { medicineName: medicineFilter }),
    }),
    [formulaFilter, feedContentFilter, medicineFilter]
  );

  const todayAggregatesArgs = useMemo(
    () =>
      babyId
        ? { babyId, date: todayStr, ...aggFilters }
        : "skip",
    [babyId, todayStr, aggFilters]
  );
  const todayAggregates = useQuery(api.events.getDailyAggregates, todayAggregatesArgs);

  const rangeAggregatesArgs = useMemo(
    () =>
      babyId && timeRange !== "24h" && timeRange !== "growth" && timeRange !== "calendar"
        ? {
            babyId,
            from: rangeStartISO,
            to: nowISO,
            ...aggFilters,
          }
        : "skip",
    [babyId, timeRange, rangeStartISO, nowISO, aggFilters]
  );
  const rangeAggregates = useQuery(api.events.getRangeAggregates, rangeAggregatesArgs);

  const weekAggregatesArgs = useMemo(
    () =>
      babyId
        ? {
            babyId,
            from: weekAgoISO,
            to: nowISO,
            ...aggFilters,
          }
        : "skip",
    [babyId, weekAgoISO, nowISO, aggFilters]
  );
  const weekAggregates = useQuery(api.events.getRangeAggregates, weekAggregatesArgs);

  const todayDiapersArgs = useMemo(() => {
    if (!babyId) return "skip";
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return {
      babyId,
      from: start.toISOString(),
      to: nowISO,
      type: "DIAPER",
      limit: 1000,
    };
  }, [babyId, todayStr, nowISO]);
  const todayDiapers = useQuery(api.events.listEvents, todayDiapersArgs);

  const weekDiapersArgs = useMemo(
    () =>
      babyId
        ? {
            babyId,
            from: weekAgoISO,
            to: nowISO,
            type: "DIAPER",
            limit: 5000,
          }
        : "skip",
    [babyId, weekAgoISO, nowISO]
  );
  const weekDiapers = useQuery(api.events.listEvents, weekDiapersArgs);

  const growthEvents = useQuery(
    api.events.listGrowthEvents,
    babyId ? { babyId } : "skip"
  );

  const matchesDiaperFilters = (event: any) => {
    const payload = event?.payload || {};
    const kind = payload?.kind || "wet";
    if (diaperKindFilter !== "all" && kind !== diaperKindFilter) return false;
    if (diaperTextureFilter !== "all" && payload?.texture !== diaperTextureFilter) return false;
    if (diaperColorFilter !== "all" && payload?.color !== diaperColorFilter) return false;
    if (blowoutOnly && !payload?.blowout) return false;
    if (rashOnly && !payload?.rash) return false;
    return true;
  };

  const filteredTodayDiapers = (todayDiapers || []).filter(matchesDiaperFilters);
  const todayDiaperCounts = filteredTodayDiapers.reduce(
    (acc: { total: number; wet: number; dirty: number; dry: number; mixed: number }, event: any) => {
      const kind = event?.payload?.kind || "wet";
      acc.total++;
      if (kind === "wet") acc.wet++;
      else if (kind === "dirty") acc.dirty++;
      else if (kind === "dry") acc.dry++;
      else if (kind === "mixed") acc.mixed++;
      return acc;
    },
    { total: 0, wet: 0, dirty: 0, dry: 0, mixed: 0 }
  );

  const filteredWeekDiapers = (weekDiapers || []).filter(matchesDiaperFilters);

  const rangeStats = (() => {
    const agg = timeRange === "24h" ? null : rangeAggregates;
    if (!agg || Object.keys(agg).length === 0) return null;

    let totalFeeds = 0;
    let totalMl = 0;
    let totalDiapers = 0;
    let totalSleepMin = 0;
    let totalSleepSessions = 0;
    let daysWithData = 0;

    Object.values(agg).forEach((data: any) => {
      const hasData = (data.feeds?.count ?? 0) > 0 || (data.diapers?.count ?? 0) > 0 || (data.sleeps?.totalMin ?? 0) > 0;
      if (hasData) daysWithData++;
      totalFeeds += data.feeds?.count || 0;
      totalMl += data.feeds?.totalMl || 0;
      totalDiapers += data.diapers?.count || 0;
      totalSleepMin += data.sleeps?.totalMin || 0;
      totalSleepSessions += data.sleeps?.sessions || 0;
    });

    const numDays = Math.max(daysWithData, 1);

    return {
      avgFeeds: Math.round(totalFeeds / numDays),
      avgMl: Math.round(totalMl / numDays),
      avgDiapers: Math.round(totalDiapers / numDays),
      avgSleepSessions: Math.round((totalSleepSessions / numDays) * 10) / 10,
      avgSleepMin: Math.round(totalSleepMin / numDays),
    };
  })();

  if (!mounted) return null;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-espresso">Trends & Analysis</h1>
          <p className="text-muted text-sm mt-1">Track growth and habits over time</p>
        </div>

        <div className="flex bg-oat p-1 rounded-xl">
          {([
            { key: "24h", label: "24h" },
            { key: "7d", label: "7d" },
            { key: "14d", label: "14d" },
            { key: "30d", label: "30d" },
            { key: "calendar", label: "Calendar" },
            { key: "growth", label: "Growth" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => startTransition(() => setTimeRange(key))}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                timeRange === key ? "bg-white shadow-sm text-espresso" : "text-muted hover:text-espresso"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!babyProfile ? (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-5xl text-sage mb-4">child_friendly</span>
          <h3 className="text-xl font-bold text-espresso mb-2">No baby profile yet</h3>
          <p className="text-muted">Add your baby's profile in Settings to see trends</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weekly Digest */}
          <WeeklyDigestCard babyId={babyId} />

          {/* Avg stats cards for 7d/14d/30d */}
          {rangeStats && (timeRange === "7d" || timeRange === "14d" || timeRange === "30d") && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-sage" />
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Feeds</span>
                </div>
                <div className="text-2xl font-bold text-espresso">{rangeStats.avgFeeds}</div>
                <div className="text-xs text-muted mt-0.5">sessions per day</div>
              </div>
              <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-sage" />
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Feed Amount</span>
                </div>
                <div className="text-2xl font-bold text-espresso">{rangeStats.avgMl}ml</div>
                <div className="text-xs text-muted mt-0.5">per day</div>
              </div>
              <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-clay" />
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Diapers</span>
                </div>
                <div className="text-2xl font-bold text-espresso">{rangeStats.avgDiapers}</div>
                <div className="text-xs text-muted mt-0.5">per day</div>
              </div>
              <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-night" />
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Sleep</span>
                </div>
                <div className="text-2xl font-bold text-espresso">{formatDuration(rangeStats.avgSleepMin)}</div>
                <div className="text-xs text-muted mt-0.5">{rangeStats.avgSleepSessions} sessions/day</div>
              </div>
            </div>
          )}

          {timeRange !== "growth" && timeRange !== "calendar" && (
            <div className="bg-white rounded-[20px] px-3 py-2.5 shadow-sm border border-muted/10">
              <div className="flex flex-wrap gap-x-2 gap-y-2 items-center">
                <FilterChip label="Kind">
                  <Select value={diaperKindFilter} onValueChange={(v) => setDiaperKindFilter(v as DiaperKindFilter)}>
                    <AppSelectTriggerCompact className="w-[4.5rem] min-w-0 py-1 px-2 text-[11px]">
                      <SelectValue />
                    </AppSelectTriggerCompact>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="wet">Wet</SelectItem>
                      <SelectItem value="dirty">Dirty</SelectItem>
                      <SelectItem value="dry">Dry</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterChip>
                <FilterChip label="Texture">
                  <Select value={diaperTextureFilter} onValueChange={(v) => setDiaperTextureFilter(v as DiaperTextureFilter)}>
                    <AppSelectTriggerCompact className="w-[4.5rem] min-w-0 py-1 px-2 text-[11px]">
                      <SelectValue />
                    </AppSelectTriggerCompact>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="runny">Runny</SelectItem>
                      <SelectItem value="mucousy">Mucousy</SelectItem>
                      <SelectItem value="mushy">Mushy</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="pebbles">Pebbles</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterChip>
                <FilterChip label="Color">
                  <Select value={diaperColorFilter} onValueChange={(v) => setDiaperColorFilter(v as DiaperColorFilter)}>
                    <AppSelectTriggerCompact className="w-[4.5rem] min-w-0 py-1 px-2 text-[11px]">
                      <SelectValue />
                    </AppSelectTriggerCompact>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="brown">Brown</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterChip>
                <span className="w-px h-4 bg-muted/20 shrink-0" />
                <button
                  type="button"
                  onClick={() => setBlowoutOnly((prev) => !prev)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${blowoutOnly ? "bg-alert-red/15 text-alert-red" : "text-muted hover:text-espresso"}`}
                >
                  Blowout
                </button>
                <button
                  type="button"
                  onClick={() => setRashOnly((prev) => !prev)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${rashOnly ? "bg-alert-red/15 text-alert-red" : "text-muted hover:text-espresso"}`}
                >
                  Rash
                </button>
                <span className="w-px h-4 bg-muted/20 shrink-0" />
                <FilterChip label="Feed">
                  <Select value={feedContentFilter} onValueChange={setFeedContentFilter}>
                    <AppSelectTriggerCompact className="w-[5rem] min-w-0 py-1 px-2 text-[11px]">
                      <SelectValue />
                    </AppSelectTriggerCompact>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="formula">Formula</SelectItem>
                      <SelectItem value="breast_milk">Breast milk</SelectItem>
                      <SelectItem value="cow_milk">Cow milk</SelectItem>
                    </SelectContent>
                  </Select>
                </FilterChip>
                {(formulasUsed?.length ?? 0) > 1 && (
                  <FilterChip label="Formula">
                    <Select value={formulaFilter} onValueChange={setFormulaFilter}>
                      <AppSelectTriggerCompact className="w-[5rem] min-w-0 py-1 px-2 text-[11px] max-w-[7rem]">
                        <SelectValue />
                      </AppSelectTriggerCompact>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {formulasUsed?.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterChip>
                )}
                {(medicinesUsed?.length ?? 0) > 1 && (
                  <FilterChip label="Medicine">
                    <Select value={medicineFilter} onValueChange={setMedicineFilter}>
                      <AppSelectTriggerCompact className="w-[5rem] min-w-0 py-1 px-2 text-[11px] max-w-[7rem]">
                        <SelectValue />
                      </AppSelectTriggerCompact>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {medicinesUsed?.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterChip>
                )}
              </div>
            </div>
          )}

          {timeRange === "calendar" ? (
            <TrendsCalendar
              babyId={babyId}
              aggFilters={aggFilters}
            />
          ) : timeRange === "24h" ? (
            <DataState
              value={todayAggregates}
              loadingFallback={
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-muted/20" />
                        <span className="h-2 w-16 rounded-full bg-muted/10" />
                      </div>
                      <div className="h-7 rounded-full bg-muted/10 mb-2" />
                      <div className="h-3 w-1/2 rounded-full bg-muted/10" />
                    </div>
                  ))}
                </div>
              }
              emptyFallback={
                <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
                  <p className="text-muted">No data for today yet</p>
                </div>
              }
            >
              {(agg) => {
                if (!agg) return null;
                return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-sage"></span>
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">Feeds</span>
                    </div>
                    <div className="text-3xl font-bold text-espresso">{agg.feeds.count}</div>
                    <div className="text-sm text-muted mt-1">{agg.feeds.totalMl}ml total</div>
                  </div>

                  <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-clay"></span>
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">Diapers</span>
                    </div>
                    <div className="text-3xl font-bold text-espresso">{todayDiaperCounts.total}</div>
                    <div className="text-sm text-muted mt-1">
                      {[["wet", todayDiaperCounts.wet], ["dirty", todayDiaperCounts.dirty], ["dry", todayDiaperCounts.dry], ["mixed", todayDiaperCounts.mixed]]
                        .filter(([, n]) => Number(n) > 0)
                        .map(([k, n]) => `${n} ${k}`)
                        .join(", ") || "—"}
                    </div>
                  </div>

                  <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-night"></span>
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">Sleep</span>
                    </div>
                    <div className="text-3xl font-bold text-espresso">{formatDuration(agg.sleeps.totalMinutes)}</div>
                    <div className="text-sm text-muted mt-1">{agg.sleeps.sessions} sessions</div>
                  </div>

                  <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-alert-red"></span>
                      <span className="text-xs font-bold text-muted uppercase tracking-wider">Meds</span>
                    </div>
                    <div className="text-3xl font-bold text-espresso">{agg.meds.adherence}%</div>
                    <div className="text-sm text-muted mt-1">
                      {agg.meds.taken} taken, {agg.meds.skipped} skipped
                    </div>
                  </div>
                </div>
                );
              }}
            </DataState>
          ) : timeRange === "7d" || timeRange === "14d" || timeRange === "30d" ? (
            <DataState
              value={rangeAggregates}
              loadingFallback={
                <div className="space-y-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10">
                      <div className="h-3 w-32 rounded-full bg-muted/10 mb-3" />
                      <div className="h-40 rounded-[16px] bg-muted/5 border border-dashed border-muted/20" />
                    </div>
                  ))}
                </div>
              }
              emptyFallback={
                <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
                  <p className="text-muted">No data for this period</p>
                </div>
              }
            >
              {(agg) => <TrendsCharts rangeAggregates={agg} days={rangeDays} />}
            </DataState>
          ) : timeRange === "growth" ? (
            <DataState
              value={growthEvents}
              loadingFallback={
                <div className="space-y-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-[20px] p-4 shadow-sm border border-muted/10 h-40" />
                  ))}
                </div>
              }
              emptyFallback={
                <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
                  <span className="material-symbols-outlined text-4xl text-muted/30 mb-3">straighten</span>
                  <h3 className="font-bold text-espresso mb-1">No growth data yet</h3>
                  <p className="text-sm text-muted">
                    Log weight, length, or head circumference in the Quick Logger to see WHO percentile charts.
                  </p>
                </div>
              }
            >
              {(events) => (
                <GrowthSection
                  events={events}
                  dob={babyProfile.dob}
                  gender={(babyProfile.gender as Gender) || "male"}
                />
              )}
            </DataState>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ---- Growth Section ---- */

function GrowthSection({
  events,
  dob,
  gender,
}: {
  events: Array<{ timestamp: string; payload?: any }>;
  dob: string;
  gender: Gender;
}) {
  const hasWeight = events.some((e) => e.payload?.weightKg);
  const hasLength = events.some((e) => e.payload?.heightCm);
  const hasHead = events.some((e) => e.payload?.headCm);
  const hasAny = hasWeight || hasLength || hasHead;

  const latest = events[events.length - 1]?.payload;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {hasAny && (
        <div className="grid grid-cols-3 gap-3">
          {latest?.weightKg ? (
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-muted/10 text-center">
              <span className="material-symbols-outlined text-sage text-xl">monitor_weight</span>
              <div className="text-2xl font-bold text-espresso mt-1">{latest.weightKg}</div>
              <div className="text-[10px] text-muted font-bold uppercase">kg</div>
            </div>
          ) : null}
          {latest?.heightCm ? (
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-muted/10 text-center">
              <span className="material-symbols-outlined text-dusty-blue text-xl">straighten</span>
              <div className="text-2xl font-bold text-espresso mt-1">{latest.heightCm}</div>
              <div className="text-[10px] text-muted font-bold uppercase">cm</div>
            </div>
          ) : null}
          {latest?.headCm ? (
            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-muted/10 text-center">
              <span className="material-symbols-outlined text-clay text-xl">face</span>
              <div className="text-2xl font-bold text-espresso mt-1">{latest.headCm}</div>
              <div className="text-[10px] text-muted font-bold uppercase">cm head</div>
            </div>
          ) : null}
        </div>
      )}

      {/* Charts */}
      <GrowthChart events={events} dob={dob} gender={gender} metric="weight" />
      <GrowthChart events={events} dob={dob} gender={gender} metric="length" />
      <GrowthChart events={events} dob={dob} gender={gender} metric="head" />

      {!hasAny && (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-4xl text-muted/30 mb-3">straighten</span>
          <h3 className="font-bold text-espresso mb-1">No growth data yet</h3>
          <p className="text-sm text-muted">
            Log weight, length, or head circumference in the Quick Logger to see WHO percentile charts.
          </p>
        </div>
      )}
    </div>
  );
}
