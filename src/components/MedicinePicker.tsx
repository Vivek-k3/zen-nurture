"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MEDICINE_DATABASE, MEDICINE_CATEGORIES, searchMedicines, type MedicineCategory } from "@/lib/medicine-database";

interface MedicinePickerProps {
  value: string;
  onChange: (name: string) => void;
}

export default function MedicinePicker({ value, onChange }: MedicinePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<MedicineCategory | "all">("all");
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    let filtered = searchMedicines(search);
    if (catFilter !== "all") {
      filtered = filtered.filter((m) => m.category === catFilter);
    }
    return filtered;
  }, [search, catFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    for (const m of results) {
      const catLabel = MEDICINE_CATEGORIES[m.category as MedicineCategory]?.label ?? m.category;
      const list = map.get(catLabel) ?? [];
      list.push(m);
      map.set(catLabel, list);
    }
    return map;
  }, [results]);

  const handleSelect = (name: string) => {
    onChange(name);
    setSearch("");
    setOpen(false);
    setShowCustom(false);
    setCatFilter("all");
  };

  const handleCustom = () => {
    if (customName.trim()) {
      handleSelect(customName.trim());
      setCustomName("");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-4 rounded-xl bg-white border border-muted/10 text-left flex items-center justify-between gap-2 hover:border-alert-red/20 transition-colors"
      >
        <span className={`text-sm font-medium ${value ? "text-espresso" : "text-muted"}`}>
          {value || "Select medicine..."}
        </span>
        <span className="material-symbols-outlined text-muted text-[18px]">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white rounded-2xl shadow-xl border border-muted/10 max-h-96 flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-muted/10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-oat/50">
              <span className="material-symbols-outlined text-muted text-[18px]">search</span>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines..."
                className="flex-1 bg-transparent text-sm text-espresso outline-none placeholder:text-muted/50"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-muted hover:text-espresso">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Category chips */}
          <div className="px-2 py-1.5 flex gap-1 overflow-x-auto border-b border-muted/10">
            <CatChip label="All" active={catFilter === "all"} onClick={() => setCatFilter("all")} />
            {(Object.entries(MEDICINE_CATEGORIES) as [MedicineCategory, { label: string }][]).map(
              ([key, { label }]) => (
                <CatChip key={key} label={label} active={catFilter === key} onClick={() => setCatFilter(key)} />
              )
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-1.5">
            {results.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No medicines found</p>
            ) : (
              Array.from(grouped.entries()).map(([category, entries]) => (
                <div key={category} className="mb-1">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2 py-1 sticky top-0 bg-white">
                    {category}
                  </p>
                  {entries.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => handleSelect(m.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-alert-red/5 flex items-center justify-between gap-2 ${
                        value === m.name ? "bg-alert-red/10 text-alert-red font-medium" : "text-espresso"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{m.name}</span>
                        {m.notes && <span className="text-[10px] text-muted">{m.notes}</span>}
                      </div>
                      {m.form && (
                        <span className="text-[10px] text-muted bg-oat px-1.5 py-0.5 rounded shrink-0">
                          {m.form}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Add custom */}
          <div className="p-2 border-t border-muted/10">
            {showCustom ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Type medicine name..."
                  className="flex-1 px-3 py-2 rounded-lg bg-oat/50 text-sm text-espresso outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCustom()}
                />
                <button
                  type="button"
                  onClick={handleCustom}
                  disabled={!customName.trim()}
                  className="px-3 py-2 rounded-lg bg-alert-red text-white text-sm font-bold disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-alert-red hover:bg-alert-red/5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add custom medicine
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CatChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
        active ? "bg-alert-red text-white" : "bg-oat text-muted hover:bg-alert-red/10"
      }`}
    >
      {label}
    </button>
  );
}
