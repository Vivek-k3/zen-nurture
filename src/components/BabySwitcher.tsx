"use client";

import { useState, useRef, useEffect } from "react";
import { useBaby } from "./BabyContext";
import { formatBabyAge } from "@/lib/time";
import Link from "next/link";
import { useGenderTheme, useGenderEmoji } from "./GenderTheme";

interface BabySwitcherProps {
  compact?: boolean;
}

export default function BabySwitcher({ compact = false }: BabySwitcherProps) {
  const { babies, activeBaby, switchBaby } = useBaby();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const genderTheme = useGenderTheme();
  const genderEmoji = useGenderEmoji();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (babies.length <= 1 && compact) return null;
  if (!activeBaby) return null;

  const initial = activeBaby.name?.[0]?.toUpperCase() ?? "?";
  const age = activeBaby.dob ? formatBabyAge(activeBaby.dob) : "";

  if (compact) {
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/50 transition-colors"
        >
          <div className={`h-7 w-7 rounded-full ${genderTheme.primaryLight} ${genderTheme.text} flex items-center justify-center text-xs font-bold`}>
            {initial}
          </div>
          <span className="text-xs font-semibold text-espresso truncate max-w-[80px]">{activeBaby.name}</span>
          {babies.length > 1 && (
            <span className="material-symbols-outlined text-muted text-[14px]">unfold_more</span>
          )}
        </button>

        {open && babies.length > 1 && (
          <Dropdown babies={babies} activeBaby={activeBaby} switchBaby={switchBaby} onClose={() => setOpen(false)} genderTheme={genderTheme} genderEmoji={genderEmoji} />
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/60 border ${genderTheme.border} hover:border-sage/30 transition-all w-full`}
      >
        <div className={`h-9 w-9 rounded-full ${genderTheme.primaryLight} ${genderTheme.text} flex items-center justify-center font-bold text-sm shrink-0`}>
          {initial}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-espresso text-sm truncate">{activeBaby.name}</p>
          {age && <p className="text-[10px] text-muted">{age}</p>}
        </div>
        {babies.length > 1 && (
          <span className="material-symbols-outlined text-muted text-[18px]">unfold_more</span>
        )}
      </button>

      {open && (
        <Dropdown babies={babies} activeBaby={activeBaby} switchBaby={switchBaby} onClose={() => setOpen(false)} genderTheme={genderTheme} genderEmoji={genderEmoji} />
      )}
    </div>
  );
}

function Dropdown({
  babies,
  activeBaby,
  switchBaby,
  onClose,
  genderTheme,
  genderEmoji,
}: {
  babies: any[];
  activeBaby: any;
  switchBaby: (id: any) => void;
  onClose: () => void;
  genderTheme: ReturnType<typeof useGenderTheme>;
  genderEmoji: string;
}) {
  const getBabyTheme = (babyGender?: string) => {
    if (babyGender === "baby-boy") return { primary: "bg-baby-blue", text: "text-baby-blue", light: "bg-baby-blue/10" };
    if (babyGender === "baby-girl") return { primary: "bg-baby-pink", text: "text-baby-pink", light: "bg-baby-pink/10" };
    return { primary: "bg-sage", text: "text-sage", light: "bg-sage/10" };
  };

  return (
    <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-2xl shadow-lg border border-muted/10 py-1.5 z-50">
      {babies.map((baby: any) => {
        const isActive = String(baby._id) === String(activeBaby._id);
        const age = baby.dob ? formatBabyAge(baby.dob) : "";
        const babyTheme = getBabyTheme(baby.gender);
        return (
          <button
            key={baby._id}
            type="button"
            onClick={() => {
              switchBaby(baby._id);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-oat/50 transition-colors ${
              isActive ? genderTheme.bg : ""
            }`}
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
              isActive ? `${babyTheme.primary} text-white` : `${babyTheme.light} ${babyTheme.text}`
            }`}>
              {baby.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-espresso truncate">{baby.name}</p>
              {age && <p className="text-[10px] text-muted">{age}</p>}
            </div>
            {isActive && (
              <span className={`material-symbols-outlined ${babyTheme.text} text-[16px]`}>check</span>
            )}
          </button>
        );
      })}
      <div className="border-t border-muted/10 mt-1 pt-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-oat/50 transition-colors text-sm text-muted"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add baby
        </Link>
      </div>
    </div>
  );
}
