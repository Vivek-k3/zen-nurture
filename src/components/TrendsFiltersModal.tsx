"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type TrendsFilterKey = "feed" | "diaper" | "sleep" | "health" | "notes" | "photos";

const FILTER_OPTIONS: { key: TrendsFilterKey; label: string; icon: string }[] = [
  { key: "notes", label: "Notes", icon: "edit_note" },
  { key: "photos", label: "Photos", icon: "photo_library" },
  { key: "feed", label: "Feed", icon: "water_drop" },
  { key: "diaper", label: "Diaper", icon: "baby_changing_station" },
  { key: "sleep", label: "Sleep", icon: "bedtime" },
  { key: "health", label: "Health", icon: "medication" },
];

export const DEFAULT_TRENDS_FILTERS: TrendsFilterKey[] = ["feed", "diaper", "sleep", "health"];

interface TrendsFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: TrendsFilterKey[];
  onApply: (selected: TrendsFilterKey[]) => void;
}

export function TrendsFiltersModal({
  open,
  onOpenChange,
  selected,
  onApply,
}: TrendsFiltersModalProps) {
  const [localSelected, setLocalSelected] = React.useState<TrendsFilterKey[]>(selected);

  React.useEffect(() => {
    if (open) setLocalSelected(selected);
  }, [open, selected]);

  const toggle = (key: TrendsFilterKey) => {
    setLocalSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleApply = () => {
    onApply(localSelected.length > 0 ? localSelected : DEFAULT_TRENDS_FILTERS);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-muted/10 bg-white p-0 sm:max-w-sm">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-muted/10 px-4 py-3">
          <DialogTitle className="text-xl font-serif font-bold text-espresso">
            Filters
          </DialogTitle>
          <button
            type="button"
            onClick={handleApply}
            className="text-sm font-bold text-sage hover:underline"
          >
            Apply
          </button>
        </DialogHeader>
        <div className="divide-y divide-muted/10">
          {FILTER_OPTIONS.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-oat/30"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-muted">
                  {icon}
                </span>
                <span className="text-sm font-medium text-espresso">{label}</span>
              </div>
              <span
                className={cn(
                  "h-5 w-5 shrink-0 rounded-full border-2 transition-colors",
                  localSelected.includes(key)
                    ? "border-sage bg-sage"
                    : "border-sage/50 bg-transparent"
                )}
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TrendsFiltersModal;
