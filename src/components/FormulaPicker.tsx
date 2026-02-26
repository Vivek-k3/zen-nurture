"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { FORMULA_DATABASE, FORMULA_BRANDS, searchFormulas, type FormulaEntry } from "@/lib/formula-database";

interface FormulaPickerProps {
  value: string;
  onChange: (formulaName: string) => void;
  savedFormulas?: Array<{ _id: string; name: string }>;
}

export default function FormulaPicker({ value, onChange, savedFormulas = [] }: FormulaPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const results = useMemo(() => searchFormulas(search), [search]);
  const grouped = useMemo(() => {
    const map = new Map<string, FormulaEntry[]>();
    for (const f of results) {
      const list = map.get(f.brand) ?? [];
      list.push(f);
      map.set(f.brand, list);
    }
    return map;
  }, [results]);

  const handleSelect = (name: string) => {
    onChange(name);
    setSearch("");
    setOpen(false);
    setShowCustom(false);
  };

  const handleCustom = () => {
    if (customName.trim()) {
      handleSelect(customName.trim());
      setCustomName("");
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-4 rounded-xl bg-white border border-muted/10 text-left flex items-center justify-between gap-2 hover:border-sage/30 transition-colors"
      >
        <span className={`text-sm font-medium ${value ? "text-espresso" : "text-muted"}`}>
          {value || "Select formula..."}
        </span>
        <span className="material-symbols-outlined text-muted text-[18px]">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white rounded-2xl shadow-xl border border-muted/10 max-h-80 flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-muted/10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-oat/50">
              <span className="material-symbols-outlined text-muted text-[18px]">search</span>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search formulas..."
                className="flex-1 bg-transparent text-sm text-espresso outline-none placeholder:text-muted/50"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-muted hover:text-espresso">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Saved formulas */}
          {savedFormulas.length > 0 && !search && (
            <div className="px-2 py-1.5 border-b border-muted/10">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2 mb-1">Recent</p>
              {savedFormulas.map((f) => (
                <button
                  key={f._id}
                  type="button"
                  onClick={() => handleSelect(f.name)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-espresso hover:bg-sage/5 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sage text-[16px]">history</span>
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-1.5">
            {results.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No formulas found</p>
            ) : (
              Array.from(grouped.entries()).map(([brand, entries]) => (
                <div key={brand} className="mb-1">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2 py-1 sticky top-0 bg-white">
                    {brand}
                  </p>
                  {entries.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => handleSelect(f.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-sage/5 flex items-center justify-between gap-2 ${
                        value === f.name ? "bg-sage/10 text-sage font-medium" : "text-espresso"
                      }`}
                    >
                      <span>{f.name}</span>
                      {f.stage && (
                        <span className="text-[10px] text-muted bg-oat px-1.5 py-0.5 rounded shrink-0">
                          {f.stage}
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
                  placeholder="Type formula name..."
                  className="flex-1 px-3 py-2 rounded-lg bg-oat/50 text-sm text-espresso outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCustom()}
                />
                <button
                  type="button"
                  onClick={handleCustom}
                  disabled={!customName.trim()}
                  className="px-3 py-2 rounded-lg bg-sage text-white text-sm font-bold disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-sage hover:bg-sage/5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add custom formula
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
