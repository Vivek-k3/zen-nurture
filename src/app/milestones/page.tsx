"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  MILESTONES,
  MILESTONE_CATEGORIES,
  type MilestoneCategory,
  type MilestoneDef,
} from "@/lib/milestone-defs";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import MediaAttacher from "@/components/MediaAttacher";
import MilestoneMedia from "@/components/MilestoneMedia";
import {
  AppSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type CategoryFilter = "all" | MilestoneCategory;
type StatusFilter = "all" | "achieved" | "upcoming";

const CELEBRATION_DURATION_MS = 2200;
const SIDE_CANNON_COLORS = ["#7C9A82", "#A8C4AD", "#C4A484", "#6B8CAE"];

export default function MilestonesPage() {
  const [mounted, setMounted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const confettiRef = useRef<ConfettiRef>(null);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const confettiFrameRef = useRef<number | null>(null);

  const [achieveModal, setAchieveModal] = useState<MilestoneDef | null>(null);
  const [achieveNote, setAchieveNote] = useState("");
  const [achievePhotoIds, setAchievePhotoIds] = useState<string[]>([]);
  const [achieveVideoIds, setAchieveVideoIds] = useState<string[]>([]);
  const [achieveSaving, setAchieveSaving] = useState(false);

  const [addCustomOpen, setAddCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState<MilestoneCategory>("physical");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customNote, setCustomNote] = useState("");
  const [customPhotoIds, setCustomPhotoIds] = useState<string[]>([]);
  const [customVideoIds, setCustomVideoIds] = useState<string[]>([]);
  const [customSaving, setCustomSaving] = useState(false);

  const stopCelebration = () => {
    if (celebrationTimeoutRef.current !== null) {
      window.clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = null;
    }
    if (confettiFrameRef.current !== null) {
      window.cancelAnimationFrame(confettiFrameRef.current);
      confettiFrameRef.current = null;
    }
  };

  const fireSideCannons = () => {
    stopCelebration();
    const end = Date.now() + CELEBRATION_DURATION_MS;
    const frame = () => {
      if (Date.now() > end) {
        confettiFrameRef.current = null;
        return;
      }
      void confettiRef.current?.fire({
        particleCount: 3,
        angle: 58,
        spread: 52,
        startVelocity: 58,
        gravity: 1,
        scalar: 0.95,
        ticks: 220,
        origin: { x: 0.02, y: 0.98 },
        colors: SIDE_CANNON_COLORS,
      });
      void confettiRef.current?.fire({
        particleCount: 3,
        angle: 122,
        spread: 52,
        startVelocity: 58,
        gravity: 1,
        scalar: 0.95,
        ticks: 220,
        origin: { x: 0.98, y: 0.98 },
        colors: SIDE_CANNON_COLORS,
      });
      confettiFrameRef.current = window.requestAnimationFrame(frame);
    };
    frame();
  };

  useEffect(() => {
    setMounted(true);
    return () => stopCelebration();
  }, []);

  const babyProfile = useQuery(api.events.getBabyProfile, {});
  const babyId = babyProfile?._id;
  const saved = useQuery(api.milestones.list, babyId ? { babyId } : "skip");
  const achieveMilestone = useMutation(api.milestones.achieve);
  const unachieveMilestone = useMutation(api.milestones.unachieve);
  const createCustomMilestone = useMutation(api.milestones.createCustom);
  const removeMilestone = useMutation(api.milestones.remove);

  if (!mounted) return null;

  const achievedMap = new Map<string, { _id: unknown; achievedAt?: string; note?: string; photoIds?: string[]; videoIds?: string[]; isCustom?: boolean }>();
  const customMilestones: { _id: unknown; key: string; title: string; category: string; achievedAt?: string; note?: string; photoIds?: string[]; videoIds?: string[] }[] = [];
  (saved ?? []).forEach((m: { key: string; _id: unknown; achievedAt?: string; note?: string; photoIds?: string[]; videoIds?: string[]; isCustom?: boolean; title: string; category: string }) => {
    if (m.achievedAt) {
      achievedMap.set(m.key, m);
      if (m.isCustom) customMilestones.push(m);
    }
  });

  const achievedPredefined = MILESTONES.filter((d) => achievedMap.has(d.key)).length;
  const totalPredefined = MILESTONES.length;
  const progress = totalPredefined > 0 ? Math.round((achievedPredefined / totalPredefined) * 100) : 0;

  const predefinedByCategory =
    categoryFilter === "all"
      ? MILESTONES
      : MILESTONES.filter((m) => m.category === categoryFilter);
  const customByCategory =
    categoryFilter === "all"
      ? customMilestones
      : customMilestones.filter((m) => m.category === categoryFilter);

  const filteredPredefined =
    statusFilter === "all"
      ? predefinedByCategory
      : statusFilter === "achieved"
        ? predefinedByCategory.filter((m) => achievedMap.has(m.key))
        : predefinedByCategory.filter((m) => !achievedMap.has(m.key));

  const filteredCustom =
    statusFilter === "all"
      ? customByCategory
      : statusFilter === "achieved"
        ? customByCategory
        : [];

  const handleOpenAchieve = (def: MilestoneDef) => {
    setAchieveModal(def);
    setAchieveNote("");
    setAchievePhotoIds([]);
    setAchieveVideoIds([]);
  };

  const handleAchieve = async () => {
    if (!babyId || !achieveModal) return;
    setAchieveSaving(true);
    try {
      await achieveMilestone({
        babyId,
        key: achieveModal.key,
        title: achieveModal.title,
        category: achieveModal.category,
        note: achieveNote.trim() || undefined,
        photoIds: achievePhotoIds.length > 0 ? achievePhotoIds : undefined,
        videoIds: achieveVideoIds.length > 0 ? achieveVideoIds : undefined,
      });
      setAchieveModal(null);
      setCelebrating(achieveModal.key);
      fireSideCannons();
      celebrationTimeoutRef.current = window.setTimeout(() => {
        setCelebrating(null);
        celebrationTimeoutRef.current = null;
      }, CELEBRATION_DURATION_MS);
    } catch (err) {
      console.error("Failed to save milestone", err);
    } finally {
      setAchieveSaving(false);
    }
  };

  const handleUnachieve = async (milestoneId: unknown) => {
    await unachieveMilestone({ id: milestoneId as Parameters<typeof unachieveMilestone>[0]["id"] });
  };

  const handleAddCustom = async () => {
    if (!babyId || !customTitle.trim()) return;
    setCustomSaving(true);
    try {
      await createCustomMilestone({
        babyId,
        title: customTitle.trim(),
        category: customCategory,
        achievedAt: customDate ? new Date(customDate).toISOString() : undefined,
        note: customNote.trim() || undefined,
        photoIds: customPhotoIds.length > 0 ? customPhotoIds : undefined,
        videoIds: customVideoIds.length > 0 ? customVideoIds : undefined,
      });
      setAddCustomOpen(false);
      setCelebrating("custom");
      fireSideCannons();
      celebrationTimeoutRef.current = window.setTimeout(() => {
        setCelebrating(null);
        celebrationTimeoutRef.current = null;
      }, CELEBRATION_DURATION_MS);
      setCustomTitle("");
      setCustomCategory("physical");
      setCustomDate(new Date().toISOString().slice(0, 10));
      setCustomNote("");
      setCustomPhotoIds([]);
      setCustomVideoIds([]);
    } catch (err) {
      console.error("Failed to add milestone", err);
    } finally {
      setCustomSaving(false);
    }
  };

  const handleRemoveCustom = async (id: unknown) => {
    await removeMilestone({ id: id as Parameters<typeof removeMilestone>[0]["id"] });
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <Confetti
        ref={confettiRef}
        manualstart
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-espresso">Milestones</h1>
          <p className="text-muted text-sm mt-1">
            {babyProfile?.name ? `${babyProfile.name}'s achievements` : "Track your baby's firsts"}
          </p>
        </div>
        {babyProfile && (
          <button
            type="button"
            onClick={() => setAddCustomOpen(true)}
            className="shrink-0 px-4 py-2 rounded-xl bg-espresso text-oat text-sm font-bold hover:bg-espresso/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add milestone
          </button>
        )}
      </div>

      {!babyProfile ? (
        <div className="bg-white rounded-[20px] p-8 text-center shadow-sm border border-muted/10">
          <span className="material-symbols-outlined text-5xl text-sage mb-4">emoji_events</span>
          <h3 className="text-xl font-bold text-espresso mb-2">No baby profile yet</h3>
          <p className="text-muted">Add your baby in Settings to track milestones</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-muted/10 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sage">emoji_events</span>
                <span className="font-bold text-espresso">
                  {achievedPredefined} / {totalPredefined}
                </span>
                <span className="text-sm text-muted">milestones achieved</span>
                {customMilestones.length > 0 && (
                  <span className="text-sm text-muted">+ {customMilestones.length} custom</span>
                )}
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

          <MilestoneFilters
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onStatusChange={setStatusFilter}
            onCategoryChange={setCategoryFilter}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {filteredPredefined.length === 0 && filteredCustom.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-muted/40 mb-3 block">
                  {statusFilter === "achieved" ? "check_circle" : statusFilter === "upcoming" ? "schedule" : "filter_alt"}
                </span>
                <p className="text-muted font-medium">
                  {statusFilter === "achieved"
                    ? "No completed milestones in this category"
                    : statusFilter === "upcoming"
                      ? "All milestones in this category are done!"
                      : "No milestones match"}
                </p>
                <p className="text-sm text-muted/80 mt-1">
                  {categoryFilter !== "all" ? "Try a different category" : "Add a milestone above"}
                </p>
              </div>
            ) : null}
            {filteredPredefined.map((def) => {
              const achieved = achievedMap.get(def.key);
              const cat = MILESTONE_CATEGORIES[def.category];
              const isCelebrating = celebrating === def.key;

              return (
                <MilestoneCard
                  key={def.key}
                  title={def.title}
                  category={cat}
                  typicalMonths={def.typicalMonths}
                  icon={def.icon}
                  achieved={!!achieved}
                  achievedAt={achieved?.achievedAt}
                  note={achieved?.note}
                  photoIds={achieved?.photoIds ?? []}
                  videoIds={achieved?.videoIds ?? []}
                  isCelebrating={isCelebrating}
                  onAchieve={() => handleOpenAchieve(def)}
                  onUnachieve={achieved ? () => handleUnachieve(achieved._id) : undefined}
                />
              );
            })}
            {filteredCustom.map((m) => {
              const cat = MILESTONE_CATEGORIES[m.category as MilestoneCategory] ?? MILESTONE_CATEGORIES.physical;
              return (
                <MilestoneCard
                  key={m.key}
                  title={m.title}
                  category={cat}
                  achieved
                  achievedAt={m.achievedAt}
                  note={m.note}
                  photoIds={m.photoIds ?? []}
                  videoIds={m.videoIds ?? []}
                  isCustom
                  onRemove={() => handleRemoveCustom(m._id)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Achieve modal */}
      <Dialog open={!!achieveModal} onOpenChange={(o) => !o && setAchieveModal(null)}>
        <DialogContent className="rounded-2xl border-muted/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-espresso">
              {achieveModal ? `🎉 ${achieveModal.title}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="achieve-note" className="text-xs font-bold text-muted uppercase tracking-wider">
                Note (optional)
              </label>
              <textarea
                id="achieve-note"
                value={achieveNote}
                onChange={(e) => setAchieveNote(e.target.value)}
                placeholder="Add a memory or detail..."
                rows={2}
                className="mt-1 w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Photos & Videos</label>
              <MediaAttacher
                photoIds={achievePhotoIds}
                videoIds={achieveVideoIds}
                onChange={(p, v) => {
                  setAchievePhotoIds(p);
                  setAchieveVideoIds(v);
                }}
                maxTotal={6}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setAchieveModal(null)}
              className="px-4 py-2 rounded-xl border border-muted/20 text-muted font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAchieve}
              disabled={achieveSaving}
              className="px-4 py-2 rounded-xl bg-espresso text-oat font-bold hover:bg-espresso/90 disabled:opacity-50"
            >
              {achieveSaving ? "Saving..." : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add custom modal */}
      <Dialog open={addCustomOpen} onOpenChange={setAddCustomOpen}>
        <DialogContent className="rounded-2xl border-muted/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-espresso">Add your own milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="custom-title" className="text-xs font-bold text-muted uppercase tracking-wider">
                Milestone name
              </label>
              <input
                id="custom-title"
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. First time at the beach"
                className="mt-1 w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="custom-category" className="text-xs font-bold text-muted uppercase tracking-wider">
                  Category
                </label>
                <Select value={customCategory} onValueChange={(v) => setCustomCategory(v as MilestoneCategory)}>
                  <AppSelectTrigger id="custom-category" className="mt-1">
                    <SelectValue />
                  </AppSelectTrigger>
                  <SelectContent>
                    {(Object.entries(MILESTONE_CATEGORIES) as [MilestoneCategory, (typeof MILESTONE_CATEGORIES)[MilestoneCategory]][]).map(
                      ([key, cat]) => (
                        <SelectItem key={key} value={key}>
                          {cat.label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="custom-date" className="text-xs font-bold text-muted uppercase tracking-wider">
                  Date
                </label>
                <input
                  id="custom-date"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="mt-1 w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso"
                />
              </div>
            </div>
            <div>
              <label htmlFor="custom-note" className="text-xs font-bold text-muted uppercase tracking-wider">
                Note (optional)
              </label>
              <textarea
                id="custom-note"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Add a memory..."
                rows={2}
                className="mt-1 w-full p-3 rounded-xl bg-oat/50 border border-muted/10 text-espresso text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Photos & Videos</label>
              <MediaAttacher
                photoIds={customPhotoIds}
                videoIds={customVideoIds}
                onChange={(p, v) => {
                  setCustomPhotoIds(p);
                  setCustomVideoIds(v);
                }}
                maxTotal={6}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setAddCustomOpen(false)}
              className="px-4 py-2 rounded-xl border border-muted/20 text-muted font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={customSaving || !customTitle.trim()}
              className="px-4 py-2 rounded-xl bg-espresso text-oat font-bold hover:bg-espresso/90 disabled:opacity-50"
            >
              {customSaving ? "Adding..." : "Add milestone"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MilestoneCard({
  title,
  category,
  typicalMonths,
  icon,
  achieved,
  achievedAt,
  note,
  photoIds,
  videoIds,
  isCelebrating,
  isCustom,
  onAchieve,
  onUnachieve,
  onRemove,
}: {
  title: string;
  category: { label: string; color: string };
  typicalMonths?: string;
  icon?: string;
  achieved: boolean;
  achievedAt?: string;
  note?: string;
  photoIds: string[];
  videoIds: string[];
  isCelebrating?: boolean;
  isCustom?: boolean;
  onAchieve?: () => void;
  onUnachieve?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        achieved
          ? `bg-${category.color}/5 border-${category.color}/20`
          : "bg-white border-muted/10"
      } ${isCelebrating ? "scale-105 shadow-lg" : "shadow-sm"}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
            achieved ? `bg-${category.color}/15 text-${category.color}` : "bg-oat text-muted/40"
          }`}
        >
          <span className="material-symbols-outlined text-xl">{icon ?? "star"}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm ${achieved ? "text-espresso" : "text-muted"}`}>
              {title}
            </h3>
            {achieved && (
              <span className="material-symbols-outlined text-sage text-[16px]">check_circle</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-${category.color}/10 text-${category.color}`}
            >
              {category.label}
            </span>
            {typicalMonths && (
              <span className="text-[10px] text-muted">Typical: {typicalMonths} months</span>
            )}
          </div>

          {achieved && achievedAt && (
            <p className="text-[11px] text-muted mt-1">
              Achieved{" "}
              {new Date(achievedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {note ? ` — ${note}` : ""}
            </p>
          )}

          {achieved && (photoIds.length > 0 || videoIds.length > 0) && (
            <MilestoneMedia photoIds={photoIds} videoIds={videoIds} />
          )}
        </div>

        <div className="shrink-0">
          {isCustom && onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted/40 hover:text-alert-red transition-colors"
              title="Remove"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          ) : achieved && onUnachieve ? (
            <button
              type="button"
              onClick={onUnachieve}
              className="text-muted/40 hover:text-alert-red transition-colors"
              title="Undo"
            >
              <span className="material-symbols-outlined text-[18px]">undo</span>
            </button>
          ) : onAchieve ? (
            <button
              type="button"
              onClick={onAchieve}
              className="px-3 py-1.5 rounded-lg bg-espresso text-oat text-[11px] font-bold hover:bg-espresso/90 transition-all"
            >
              Done!
            </button>
          ) : null}
        </div>
      </div>

      {isCelebrating && (
        <div className="mt-2 text-center animate-bounce">
          <span className="text-2xl">🎉</span>
        </div>
      )}
    </div>
  );
}

function MilestoneFilters({
  statusFilter,
  categoryFilter,
  onStatusChange,
  onCategoryChange,
}: {
  statusFilter: StatusFilter;
  categoryFilter: CategoryFilter;
  onStatusChange: (v: StatusFilter) => void;
  onCategoryChange: (v: CategoryFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["all", "upcoming", "achieved"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onStatusChange(value)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            statusFilter === value ? "bg-espresso text-oat" : "text-muted hover:text-espresso"
          }`}
        >
          {value === "all" ? "All" : value === "upcoming" ? "Upcoming" : "Completed"}
        </button>
      ))}
      <span className="w-px h-4 bg-muted/20" aria-hidden />
      <button
        type="button"
        onClick={() => onCategoryChange("all")}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
          categoryFilter === "all" ? "bg-espresso text-oat" : "text-muted hover:text-espresso"
        }`}
      >
        All
      </button>
      {(Object.keys(MILESTONE_CATEGORIES) as MilestoneCategory[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onCategoryChange(key)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            categoryFilter === key ? "bg-espresso text-oat" : "text-muted hover:text-espresso"
          }`}
        >
          {MILESTONE_CATEGORIES[key].label}
        </button>
      ))}
    </div>
  );
}
