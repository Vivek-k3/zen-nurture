"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDuration } from "@/lib/time";
import GrowthChart from "@/components/GrowthChart";
import TrendsCalendar from "@/components/TrendsCalendar";
import WeeklyDigestCard from "@/components/WeeklyDigestCard";
import TrendsSummarySection from "@/components/TrendsSummarySection";
import TrendsFiltersModal, {
  DEFAULT_TRENDS_FILTERS,
  type TrendsFilterKey,
} from "@/components/TrendsFiltersModal";
import TrendsMetricDrawer from "@/components/TrendsMetricDrawer";
import type { Gender } from "@/lib/who-percentiles";
import { useBaby } from "@/components/BabyContext";
import { DataState } from "@/components/DataState";
import type { TrendMetricId } from "@/components/TrendsSummarySection";

const TrendsChartsDynamic = dynamic(
  () => import("@/components/TrendsCharts"),
  { ssr: false }
);
const TrendsCalendarDynamic = dynamic(
  () => import("@/components/TrendsCalendar"),
  { ssr: false }
);

type TrendsTab = "1d" | "7d" | "14d" | "growth" | "calendar";

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState<TrendsTab>("7d");
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [eventTypeFilters, setEventTypeFilters] = useState<TrendsFilterKey[]>(DEFAULT_TRENDS_FILTERS);
  const [drawerMetric, setDrawerMetric] = useState<{
    id: TrendMetricId;
    summary: string;
  } | null>(null);
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
  const rangeDays = timeRange === "1d" ? 1 : timeRange === "14d" ? 14 : 7;
  const rangeStartISO = useMemo(
    () =>
      timeRange === "1d"
        ? todayStr + "T00:00:00.000Z"
        : new Date(nowMs - (rangeDays - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T00:00:00.000Z",
    [rangeDays, nowMs, timeRange, todayStr]
  );
  const nowISO = useMemo(() => new Date(nowMs).toISOString(), [nowMs]);

  const prevRangeStartISO = useMemo(
    () =>
      new Date(nowMs - (rangeDays * 2 - 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T00:00:00.000Z",
    [rangeDays, nowMs]
  );
  const prevRangeEndISO = useMemo(
    () =>
      new Date(nowMs - rangeDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0] + "T23:59:59.999Z",
    [rangeDays, nowMs]
  );

  const yesterdayStr = useMemo(() => {
    const d = new Date(nowMs);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, [nowMs]);

  const todayAggregatesArgs = useMemo(
    () => (babyId ? { babyId, date: todayStr } : "skip"),
    [babyId, todayStr]
  );
  const todayAggregates = useQuery(api.events.getDailyAggregates, todayAggregatesArgs);

  const yesterdayAggregatesArgs = useMemo(
    () => (babyId ? { babyId, date: yesterdayStr } : "skip"),
    [babyId, yesterdayStr]
  );
  const yesterdayAggregates = useQuery(api.events.getDailyAggregates, yesterdayAggregatesArgs);

  const rangeAggregatesArgs = useMemo(
    () =>
      babyId && (timeRange === "1d" || timeRange === "7d" || timeRange === "14d")
        ? {
            babyId,
            from: rangeStartISO,
            to: nowISO,
            eventTypes: eventTypeFilters.length > 0 ? eventTypeFilters : undefined,
          }
        : "skip",
    [babyId, timeRange, rangeStartISO, nowISO, eventTypeFilters]
  );
  const rangeAggregates = useQuery(api.events.getRangeAggregates, rangeAggregatesArgs);

  const prevRangeAggregatesArgs = useMemo(
    () =>
      babyId && (timeRange === "7d" || timeRange === "14d")
        ? {
            babyId,
            from: prevRangeStartISO,
            to: prevRangeEndISO,
            eventTypes: eventTypeFilters.length > 0 ? eventTypeFilters : undefined,
          }
        : "skip",
    [babyId, timeRange, prevRangeStartISO, prevRangeEndISO, eventTypeFilters]
  );
  const prevRangeAggregates = useQuery(api.events.getRangeAggregates, prevRangeAggregatesArgs);

  const rangeSummaryArgs = useMemo(
    () =>
      babyId && (timeRange === "7d" || timeRange === "14d")
        ? { babyId, from: rangeStartISO, to: nowISO }
        : "skip",
    [babyId, timeRange, rangeStartISO, nowISO]
  );
  const rangeSummary = useQuery(api.events.getTrendsRangeSummary, rangeSummaryArgs);

  const growthEvents = useQuery(
    api.events.listGrowthEvents,
    babyId ? { babyId } : "skip"
  );

  const dateLabel = useMemo(() => {
    const d = new Date(nowMs);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [nowMs]);

  const { summaryData, deltas } = useMemo(() => {
    const is1d = timeRange === "1d";
    const today = todayAggregates;
    const yesterday = yesterdayAggregates;
    const current = is1d ? today : rangeAggregates;
    const previous = is1d ? yesterday : prevRangeAggregates;

    const numDays = is1d ? 1 : Math.max(Object.keys(current ?? {}).length, 1);
    const prevNumDays = is1d ? 1 : Math.max(Object.keys(previous ?? {}).length, 1);

    const sumCurrent = (agg: Record<string, any> | null | undefined) => {
      if (!agg) return { feeds: 0, ml: 0, diapers: 0, sleepMin: 0, sleepSessions: 0, medsTaken: 0, medsSkipped: 0 };
      if (is1d && agg) {
        return {
          feeds: agg.feeds?.count ?? 0,
          ml: agg.feeds?.totalMl ?? 0,
          diapers: agg.diapers?.total ?? 0,
          sleepMin: agg.sleeps?.totalMinutes ?? 0,
          sleepSessions: agg.sleeps?.sessions ?? 0,
          medsTaken: agg.meds?.taken ?? 0,
          medsSkipped: agg.meds?.skipped ?? 0,
        };
      }
      let feeds = 0, ml = 0, diapers = 0, sleepMin = 0, sleepSessions = 0, medsTaken = 0, medsSkipped = 0;
      for (const d of Object.values(agg ?? {})) {
        feeds += (d as any).feeds?.count ?? 0;
        ml += (d as any).feeds?.totalMl ?? 0;
        diapers += (d as any).diapers?.count ?? 0;
        sleepMin += (d as any).sleeps?.totalMin ?? 0;
        sleepSessions += (d as any).sleeps?.sessions ?? 0;
        medsTaken += (d as any).meds?.taken ?? 0;
        medsSkipped += (d as any).meds?.skipped ?? 0;
      }
      return { feeds, ml, diapers, sleepMin, sleepSessions, medsTaken, medsSkipped };
    };

    const cur = sumCurrent(current as Record<string, any> | null);
    const prev = sumCurrent(previous as Record<string, any> | null);

    const feedSection = is1d && today
      ? {
          sessions: today.feeds?.count ?? 0,
          totalMl: today.feeds?.totalMl ?? 0,
          bottleSizeAvg: today.feeds?.bottleSizeAvg ?? 0,
          avgGapMin: today.feeds?.avgGapMin ?? 0,
          subBreakdown: today.feeds?.totalMl ? `Formula ${today.feeds.totalMl}mL` : undefined,
        }
      : rangeAggregates && Object.keys(rangeAggregates).length > 0
        ? (() => {
            let tFeeds = 0, tMl = 0;
            for (const d of Object.values(rangeAggregates)) {
              tFeeds += (d as any).feeds?.count ?? 0;
              tMl += (d as any).feeds?.totalMl ?? 0;
            }
            const n = Math.max(Object.keys(rangeAggregates).length, 1);
            const avgBottle = rangeSummary?.bottleSizeAvg ?? (tFeeds > 0 ? Math.round(tMl / tFeeds) : 0);
            return {
              sessions: Math.round((cur.feeds / numDays) * 10) / 10,
              totalMl: Math.round(cur.ml / numDays),
              bottleSizeAvg: avgBottle,
              avgGapMin: rangeSummary?.avgGapMin ?? 0,
              subBreakdown: `per day`,
            };
          })()
        : null;

    const diaperSection = is1d && today
      ? (() => {
          const diaperBreakdown: Array<[string, number | undefined]> = [
            ["wet", today.diapers?.wet],
            ["dirty", today.diapers?.dirty],
          ];

          return {
            total: today.diapers?.total ?? 0,
            subBreakdown: diaperBreakdown
            .filter(([, n]) => (n ?? 0) > 0)
            .map(([k, n]) => `${n} ${k}`)
            .join(", ") || undefined,
          };
        })()
      : {
          total: Math.round((cur.diapers / numDays) * 10) / 10,
          subBreakdown: "per day",
        };

    const sleepSection = is1d && today
      ? {
          totalMin: today.sleeps?.totalMinutes ?? 0,
          sessions: today.sleeps?.sessions ?? 0,
        }
      : {
          totalMin: Math.round(cur.sleepMin / numDays),
          sessions: Math.round((cur.sleepSessions / numDays) * 10) / 10,
        };

    const healthSection = is1d && today
      ? {
          adherence: today.meds?.adherence ?? 100,
          taken: today.meds?.taken ?? 0,
          skipped: today.meds?.skipped ?? 0,
        }
      : (() => {
          const total = cur.medsTaken + cur.medsSkipped;
          return {
            adherence: total > 0 ? Math.round((cur.medsTaken / total) * 100) : 100,
            taken: cur.medsTaken,
            skipped: cur.medsSkipped,
          };
        })();

    const feedDelta = {
      sessions: cur.feeds - prev.feeds,
      ml: cur.ml - prev.ml,
      bottleSize: (rangeSummary?.bottleSizeAvg ?? 0) - (prev.ml > 0 && prev.feeds > 0 ? Math.round(prev.ml / prev.feeds) : 0),
      gapMin: (rangeSummary?.avgGapMin ?? 0) - 0,
    };
    const diaperDelta = cur.diapers - prev.diapers;
    const sleepDelta = {
      totalMin: cur.sleepMin - prev.sleepMin,
      sessions: cur.sleepSessions - prev.sleepSessions,
    };
    const healthDelta = {
      adherence: healthSection.adherence - (prev.medsTaken + prev.medsSkipped > 0
        ? Math.round((prev.medsTaken / (prev.medsTaken + prev.medsSkipped)) * 100)
        : 100),
    };

    return {
      summaryData: {
        feed: feedSection,
        diaper: diaperSection,
        sleep: sleepSection,
        health: healthSection,
      },
      deltas: {
        feed: feedDelta,
        diaper: diaperDelta,
        sleep: sleepDelta,
        health: healthDelta,
      },
    };
  }, [
    timeRange,
    todayAggregates,
    yesterdayAggregates,
    rangeAggregates,
    prevRangeAggregates,
    rangeSummary,
  ]);

  const drawerSummaryValue = useMemo(() => {
    if (!drawerMetric) return "";
    const s = summaryData;
    switch (drawerMetric.id) {
      case "feed-sessions":
        return s.feed ? `${s.feed.sessions} sessions per day` : "—";
      case "amount-bottlefed":
        return s.feed ? `${s.feed.totalMl} mL per day` : "—";
      case "bottle-size":
        return s.feed ? `${s.feed.bottleSizeAvg} mL average` : "—";
      case "time-btwn-feedings":
        return s.feed ? `${formatDuration(s.feed.avgGapMin)} average` : "—";
      case "total-diapers":
        return s.diaper ? `${s.diaper.total} diapers per day` : "—";
      case "total-sleep":
        return s.sleep ? `${formatDuration(s.sleep.totalMin)}` : "—";
      case "med-adherence":
        return s.health ? `${s.health.adherence}%` : "—";
      default:
        return drawerMetric.summary;
    }
  }, [drawerMetric, summaryData]);

  if (!mounted) return null;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-espresso">Trends & Analysis</h1>
          <p className="text-muted text-sm mt-1">Track growth and habits over time</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-espresso">{dateLabel}</span>
          <div className="flex bg-oat p-1 rounded-xl">
            {(
              [
                { key: "1d" as const, label: "1d" },
                { key: "7d" as const, label: "7d" },
                { key: "14d" as const, label: "14d" },
                { key: "calendar" as const, label: "Calendar" },
                { key: "growth" as const, label: "Growth" },
              ] as const
            ).map(({ key, label }) => (
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
          {timeRange !== "growth" && timeRange !== "calendar" && (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="p-2 rounded-xl hover:bg-oat text-muted hover:text-espresso transition-colors"
              title="Filters"
            >
              <span className="material-symbols-outlined text-xl">filter_list</span>
            </button>
          )}
        </div>
      </div>

      <TrendsFiltersModal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        selected={eventTypeFilters}
        onApply={setEventTypeFilters}
      />

      {!babyProfile ? (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-5xl text-sage mb-4">child_friendly</span>
          <h3 className="text-xl font-bold text-espresso mb-2">No baby profile yet</h3>
          <p className="text-muted">Add your baby's profile in Settings to see trends</p>
        </div>
      ) : (
        <div className="space-y-6">
          <WeeklyDigestCard babyId={babyId} />

          {timeRange === "1d" && (
            <DataState
              value={todayAggregates}
              loadingFallback={
                <div className="bg-white rounded-[20px] p-8 shadow-sm border border-muted/10">
                  <div className="h-64 rounded-xl bg-muted/5 animate-pulse" />
                </div>
              }
              emptyFallback={
                <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
                  <p className="text-muted">No data for today yet</p>
                </div>
              }
            >
              {() => (
                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                  <TrendsSummarySection
                    feed={summaryData.feed}
                    diaper={summaryData.diaper}
                    sleep={summaryData.sleep}
                    health={summaryData.health}
                    feedDelta={deltas.feed}
                    diaperDelta={deltas.diaper}
                    sleepDelta={deltas.sleep}
                    healthDelta={deltas.health}
                    onMetricClick={(id) =>
                      setDrawerMetric({ id, summary: "" })
                    }
                  />
                </div>
              )}
            </DataState>
          )}

          {(timeRange === "7d" || timeRange === "14d") && (
            <DataState
              value={rangeAggregates}
              loadingFallback={
                <div className="bg-white rounded-[20px] p-8 shadow-sm border border-muted/10">
                  <div className="h-64 rounded-xl bg-muted/5 animate-pulse" />
                </div>
              }
              emptyFallback={
                <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
                  <p className="text-muted">No data for this period</p>
                </div>
              }
            >
              {() => (
                <>
                  <div className="bg-white rounded-[20px] p-6 shadow-sm border border-muted/10">
                    <TrendsSummarySection
                      feed={summaryData.feed}
                      diaper={summaryData.diaper}
                      sleep={summaryData.sleep}
                      health={summaryData.health}
                      feedDelta={deltas.feed}
                      diaperDelta={deltas.diaper}
                      sleepDelta={deltas.sleep}
                      healthDelta={deltas.health}
                      onMetricClick={(id) =>
                        setDrawerMetric({ id, summary: "" })
                      }
                    />
                  </div>
                  <DataState
                    value={rangeAggregates}
                    isEmpty={(agg) => Object.keys(agg ?? {}).length === 0}
                  >
                    {(agg) => (
                      <TrendsChartsDynamic rangeAggregates={agg} days={rangeDays} />
                    )}
                  </DataState>
                </>
              )}
            </DataState>
          )}

          {timeRange === "calendar" && (
            <TrendsCalendarDynamic
              babyId={babyId}
              eventTypes={eventTypeFilters}
            />
          )}

          {timeRange === "growth" && (
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
          )}
        </div>
      )}

      {drawerMetric && babyId && (
        <TrendsMetricDrawer
          open={!!drawerMetric}
          onOpenChange={(open) => !open && setDrawerMetric(null)}
          metricId={drawerMetric.id}
          summaryValue={drawerSummaryValue}
          babyId={babyId}
          fromISO={rangeStartISO}
          toISO={nowISO}
          rangeDays={timeRange === "1d" ? 1 : rangeDays}
          rangeAggregates={
            timeRange === "1d" && todayAggregates
              ? {
                  [todayStr]: {
                    feeds: todayAggregates.feeds,
                    diapers: {
                      ...todayAggregates.diapers,
                      count: todayAggregates.diapers?.total ?? 0,
                    },
                    sleeps: {
                      totalMin: todayAggregates.sleeps?.totalMinutes ?? 0,
                      sessions: todayAggregates.sleeps?.sessions ?? 0,
                    },
                    meds: todayAggregates.meds,
                  },
                }
              : (rangeAggregates ?? null)
          }
        />
      )}
    </div>
  );
}

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
