"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  MILESTONES,
  MILESTONE_CATEGORIES,
  type MilestoneCategory,
  type MilestoneDef,
} from "@/lib/milestone-defs";
import { formatBabyAge } from "@/lib/time";

type Filter = "all" | MilestoneCategory;

export default function MilestonesPage() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [celebrating, setCelebrating] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const babyProfile = useQuery(api.events.getBabyProfile, {});
  const babyId = babyProfile?._id;
  const saved = useQuery(api.milestones.list, babyId ? { babyId } : "skip");
  const achieveMilestone = useMutation(api.milestones.achieve);
  const unachieveMilestone = useMutation(api.milestones.unachieve);

  if (!mounted) return null;

  const achievedMap = new Map<string, any>();
  (saved ?? []).forEach((m: any) => {
    if (m.achievedAt) achievedMap.set(m.key, m);
  });

  const achievedCount = achievedMap.size;
  const totalCount = MILESTONES.length;
  const progress = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;

  const filtered = filter === "all"
    ? MILESTONES
    : MILESTONES.filter((m) => m.category === filter);

  const handleAchieve = async (def: MilestoneDef) => {
    if (!babyId) return;
    setCelebrating(def.key);
    await achieveMilestone({
      babyId,
      key: def.key,
      title: def.title,
      category: def.category,
    });
    setTimeout(() => setCelebrating(null), 1500);
  };

  const handleUnachieve = async (milestoneId: any) => {
    await unachieveMilestone({ id: milestoneId });
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-espresso">Milestones</h1>
        <p className="text-muted text-sm mt-1">
          {babyProfile?.name ? `${babyProfile.name}'s achievements` : "Track your baby's firsts"}
        </p>
      </div>

      {!babyProfile ? (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-5xl text-sage mb-4">emoji_events</span>
          <h3 className="text-xl font-bold text-espresso mb-2">No baby profile yet</h3>
          <p className="text-muted">Add your baby in Settings to track milestones</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sage">emoji_events</span>
                <span className="font-bold text-espresso">{achievedCount} / {totalCount}</span>
                <span className="text-sm text-muted">milestones achieved</span>
              </div>
              <span className="text-sm font-mono font-bold text-sage">{progress}%</span>
            </div>
            <div className="h-2.5 bg-oat rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sage to-sage-light rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            {(Object.entries(MILESTONE_CATEGORIES) as [MilestoneCategory, typeof MILESTONE_CATEGORIES[MilestoneCategory]][]).map(
              ([key, cat]) => (
                <FilterChip
                  key={key}
                  label={cat.label}
                  active={filter === key}
                  onClick={() => setFilter(key)}
                />
              )
            )}
          </div>

          {/* Milestone grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((def) => {
              const achieved = achievedMap.get(def.key);
              const cat = MILESTONE_CATEGORIES[def.category];
              const isCelebrating = celebrating === def.key;

              return (
                <div
                  key={def.key}
                  className={`rounded-2xl border p-4 transition-all ${
                    achieved
                      ? `bg-${cat.color}/5 border-${cat.color}/20`
                      : "bg-white border-muted/10"
                  } ${isCelebrating ? "scale-105 shadow-lg" : "shadow-sm"}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
                        achieved ? `bg-${cat.color}/15 text-${cat.color}` : "bg-oat text-muted/40"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{def.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold text-sm ${achieved ? "text-espresso" : "text-muted"}`}>
                          {def.title}
                        </h3>
                        {achieved && (
                          <span className="material-symbols-outlined text-sage text-[16px]">
                            check_circle
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-${cat.color}/10 text-${cat.color}`}>
                          {cat.label}
                        </span>
                        {def.typicalMonths && (
                          <span className="text-[10px] text-muted">
                            Typical: {def.typicalMonths} months
                          </span>
                        )}
                      </div>

                      {achieved && achieved.achievedAt && (
                        <p className="text-[11px] text-muted mt-1">
                          Achieved {new Date(achieved.achievedAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                          {achieved.note ? ` — ${achieved.note}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {achieved ? (
                        <button
                          type="button"
                          onClick={() => handleUnachieve(achieved._id)}
                          className="text-muted/40 hover:text-alert-red transition-colors"
                          title="Undo"
                        >
                          <span className="material-symbols-outlined text-[18px]">undo</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAchieve(def)}
                          className="px-3 py-1.5 rounded-lg bg-espresso text-oat text-[11px] font-bold hover:bg-espresso/90 transition-all"
                        >
                          Done!
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Celebration animation */}
                  {isCelebrating && (
                    <div className="mt-2 text-center animate-bounce">
                      <span className="text-2xl">🎉</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
        active ? "bg-espresso text-oat" : "bg-white text-muted border border-muted/10 hover:border-muted/30"
      }`}
    >
      {label}
    </button>
  );
}
