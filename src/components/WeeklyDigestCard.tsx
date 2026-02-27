"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MoraOrb from "@/components/MoraOrb";

interface WeeklyDigestCardProps {
  babyId: any;
}

export default function WeeklyDigestCard({ babyId }: WeeklyDigestCardProps) {
  const digest = useQuery(api.digest.getLatestDigest, babyId ? { babyId } : "skip");
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await fetch("/api/digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ babyId }),
      });
    } catch {}
    setGenerating(false);
  };

  if (!digest) {
    return (
      <div className="bg-gradient-to-br from-sage/5 to-clay/5 rounded-[20px] p-5 border border-sage/15">
        <div className="flex items-center gap-3 mb-3">
          <MoraOrb size="sm" state={generating ? "thinking" : "idle"} />
          <div>
            <h3 className="text-sm font-bold text-espresso">Weekly Digest</h3>
            <p className="text-[11px] text-muted">AI-powered summary of your week</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-2.5 rounded-xl bg-espresso text-oat text-sm font-bold hover:bg-espresso/90 disabled:opacity-50 transition-all"
        >
          {generating ? "Generating..." : "Generate This Week's Digest"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sage/5 to-clay/5 rounded-[20px] p-5 border border-sage/15">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <MoraOrb size="sm" state="idle" />
          <div>
            <h3 className="text-sm font-bold text-espresso">Weekly Digest</h3>
            <p className="text-[11px] text-muted">
              {digest.weekStart} → {digest.weekEnd}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="text-[10px] text-sage font-bold hover:underline disabled:opacity-50"
          >
            {generating ? "..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-muted hover:text-espresso"
          >
            <span className="material-symbols-outlined text-[18px]">
              {expanded ? "expand_less" : "expand_more"}
            </span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <MiniStat label="Feeds" value={digest.thisWeek?.feeds?.perDay} unit="/d" />
        <MiniStat label="Diapers" value={digest.thisWeek?.diapers?.perDay} unit="/d" />
        <MiniStat label="Sleep" value={digest.thisWeek?.sleep?.avgPerDay} unit="h/d" />
        <MiniStat label="Meds" value={`${digest.thisWeek?.meds?.adherence}%`} />
      </div>

      {/* Expandable AI summary */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-sage/10">
          <div className="prose-sm text-[13px] text-espresso leading-relaxed whitespace-pre-wrap">
            {digest.summary}
          </div>
        </div>
      )}

      {!expanded && digest.summary && (
        <p className="text-[12px] text-muted line-clamp-2">{digest.summary.slice(0, 120)}...</p>
      )}
    </div>
  );
}

function MiniStat({ label, value, unit = "" }: { label: string; value: any; unit?: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-muted font-bold uppercase">{label}</p>
      <p className="font-mono font-bold text-espresso text-sm">
        {value ?? "--"}{typeof value === "number" ? unit : ""}
      </p>
    </div>
  );
}
