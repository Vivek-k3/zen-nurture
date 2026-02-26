"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDuration, getDateDaysAgo } from "@/lib/time";

type DiaperKindFilter = "all" | "wet" | "dirty" | "dry" | "mixed";
type DiaperTextureFilter = "all" | "runny" | "mucousy" | "mushy" | "solid" | "pebbles";
type DiaperColorFilter = "all" | "black" | "green" | "yellow" | "brown" | "red" | "gray";

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d">("24h");
  const [diaperKindFilter, setDiaperKindFilter] = useState<DiaperKindFilter>("all");
  const [diaperTextureFilter, setDiaperTextureFilter] = useState<DiaperTextureFilter>("all");
  const [diaperColorFilter, setDiaperColorFilter] = useState<DiaperColorFilter>("all");
  const [blowoutOnly, setBlowoutOnly] = useState(false);
  const [rashOnly, setRashOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const babyProfile = useQuery(api.events.getBabyProfile, {});
  const todayStr = new Date().toISOString().split("T")[0];
  const babyId = babyProfile?._id;

  const todayAggregates = useQuery(
    api.events.getDailyAggregates,
    babyId
      ? {
          babyId,
          date: todayStr,
        }
      : "skip"
  );

  const weekAgo = getDateDaysAgo(6);
  const weekAggregates = useQuery(
    api.events.getRangeAggregates,
    babyId
      ? {
          babyId,
          from: weekAgo.toISOString(),
          to: new Date().toISOString(),
        }
      : "skip"
  );

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayDiapers = useQuery(
    api.events.listEvents,
    babyId
      ? {
          babyId,
          from: startOfToday.toISOString(),
          to: new Date().toISOString(),
          type: "DIAPER",
          limit: 1000,
        }
      : "skip"
  );

  const weekDiapers = useQuery(
    api.events.listEvents,
    babyId
      ? {
          babyId,
          from: weekAgo.toISOString(),
          to: new Date().toISOString(),
          type: "DIAPER",
          limit: 5000,
        }
      : "skip"
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

  const weeklyStats = (() => {
    if (!weekAggregates) return null;

    let totalFeeds = 0;
    let totalMl = 0;
    let totalSleepMin = 0;
    let daysWithData = 0;

    Object.values(weekAggregates).forEach((data: any) => {
      if (data.feeds?.count > 0 || data.diapers?.count > 0) {
        daysWithData++;
      }
      totalFeeds += data.feeds?.count || 0;
      totalMl += data.feeds?.totalMl || 0;
      totalSleepMin += data.sleeps?.totalMin || 0;
    });

    const filteredCountsByDate: Record<string, number> = {};
    filteredWeekDiapers.forEach((event: any) => {
      const date = event.timestamp.split("T")[0];
      filteredCountsByDate[date] = (filteredCountsByDate[date] || 0) + 1;
    });
    const totalFilteredDiapers = Object.values(filteredCountsByDate).reduce((sum, count) => sum + count, 0);

    return {
      avgFeeds: daysWithData > 0 ? Math.round(totalFeeds / daysWithData) : 0,
      avgMl: daysWithData > 0 ? Math.round(totalMl / daysWithData) : 0,
      avgDiapersFiltered: daysWithData > 0 ? Math.round(totalFilteredDiapers / daysWithData) : 0,
      avgDiapersUnfiltered:
        daysWithData > 0
          ? Math.round(
              Object.values(weekAggregates).reduce((sum: number, data: any) => sum + (data.diapers?.count || 0), 0) /
                daysWithData
            )
          : 0,
      totalSleep: Math.round(totalSleepMin / 60),
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
          <button
            type="button"
            onClick={() => setTimeRange("24h")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              timeRange === "24h" ? "bg-white shadow-sm text-espresso" : "text-muted hover:text-espresso"
            }`}
          >
            24h
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("7d")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              timeRange === "7d" ? "bg-white shadow-sm text-espresso" : "text-muted hover:text-espresso"
            }`}
          >
            7d
          </button>
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
          <div className="bg-white rounded-[20px] p-4 shadow-sm border border-muted/10">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2">Diaper Filters</span>
              {(["all", "wet", "dirty", "dry"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setDiaperKindFilter(kind)}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    diaperKindFilter === kind ? "bg-sage text-white" : "bg-oat text-muted"
                  }`}
                >
                  {kind}
                </button>
              ))}
              {(["all", "runny", "mucousy", "mushy", "solid", "pebbles"] as const).map((texture) => (
                <button
                  key={texture}
                  type="button"
                  onClick={() => setDiaperTextureFilter(texture)}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    diaperTextureFilter === texture ? "bg-night text-white" : "bg-oat text-muted"
                  }`}
                >
                  {texture}
                </button>
              ))}
              {(["all", "black", "green", "yellow", "brown", "red", "gray"] as const).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDiaperColorFilter(color)}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    diaperColorFilter === color ? "bg-clay text-white" : "bg-oat text-muted"
                  }`}
                >
                  {color}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBlowoutOnly((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${blowoutOnly ? "bg-alert-red text-white" : "bg-oat text-muted"}`}
              >
                Blowout
              </button>
              <button
                type="button"
                onClick={() => setRashOnly((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${rashOnly ? "bg-alert-red text-white" : "bg-oat text-muted"}`}
              >
                Rash
              </button>
            </div>
          </div>

          {timeRange === "24h" ? (
            todayAggregates ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-sage"></span>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Feeds</span>
                  </div>
                  <div className="text-3xl font-bold text-espresso">{todayAggregates.feeds.count}</div>
                  <div className="text-sm text-muted mt-1">{todayAggregates.feeds.totalMl}ml total</div>
                </div>

                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-clay"></span>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Diapers</span>
                  </div>
                  <div className="text-3xl font-bold text-espresso">{todayDiaperCounts.total}</div>
                  <div className="text-sm text-muted mt-1">
                    {todayDiaperCounts.wet} wet, {todayDiaperCounts.dirty} dirty, {todayDiaperCounts.dry} dry
                  </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-night"></span>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Sleep</span>
                  </div>
                  <div className="text-3xl font-bold text-espresso">{formatDuration(todayAggregates.sleeps.totalMinutes)}</div>
                  <div className="text-sm text-muted mt-1">{todayAggregates.sleeps.sessions} sessions</div>
                </div>

                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-alert-red"></span>
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Meds</span>
                  </div>
                  <div className="text-3xl font-bold text-espresso">{todayAggregates.meds.adherence}%</div>
                  <div className="text-sm text-muted mt-1">
                    {todayAggregates.meds.taken} taken, {todayAggregates.meds.skipped} skipped
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
                <p className="text-muted">No data for today yet</p>
              </div>
            )
          ) : weeklyStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-sage"></span>
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Feeds/Day</span>
                </div>
                <div className="text-3xl font-bold text-espresso">{weeklyStats.avgFeeds}</div>
                <div className="text-sm text-muted mt-1">per day</div>
              </div>

              <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-sage"></span>
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Intake</span>
                </div>
                <div className="text-3xl font-bold text-espresso">{weeklyStats.avgMl}ml</div>
                <div className="text-sm text-muted mt-1">per day</div>
              </div>

              <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-clay"></span>
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Diapers</span>
                </div>
                <div className="text-3xl font-bold text-espresso">{weeklyStats.avgDiapersUnfiltered}</div>
                <div className="text-xs text-muted mt-1">Unfiltered baseline</div>
              </div>

              <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-clay"></span>
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Filtered Diapers</span>
                </div>
                <div className="text-3xl font-bold text-espresso">{weeklyStats.avgDiapersFiltered}</div>
                <div className="text-xs text-muted mt-1">Avg/day with filters applied</div>
              </div>

              <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10 col-span-2 md:col-span-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-night"></span>
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Sleep</span>
                </div>
                <div className="text-3xl font-bold text-espresso">{weeklyStats.totalSleep}h</div>
                <div className="text-sm text-muted mt-1">this week</div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
              <p className="text-muted">No data for the past week</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
