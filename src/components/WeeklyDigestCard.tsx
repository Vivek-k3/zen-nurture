"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import MoraOrb from "@/components/MoraOrb";
import { DataState } from "@/components/DataState";
import DigestMarkdown from "@/components/DigestMarkdown";
import { Card, CardContent } from "@/components/ui/card";

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

  return (
    <DataState
      value={digest}
      loadingFallback={
        <div className="bg-gradient-to-br from-sage/5 to-clay/5 rounded-[20px] p-5 border border-sage/15 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-sage/20" />
            <div className="space-y-1">
              <div className="h-3 w-28 rounded-full bg-muted/10" />
              <div className="h-2.5 w-40 rounded-full bg-muted/10" />
            </div>
          </div>
          <div className="h-9 rounded-xl bg-muted/10" />
        </div>
      }
      emptyFallback={
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
      }
    >
      {(currentDigest) => {
        if (!currentDigest) return null;
        return (
        <div className="bg-gradient-to-br from-sage/5 to-clay/5 rounded-[20px] p-5 border border-sage/15">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <MoraOrb size="sm" state="idle" />
          <div>
            <h3 className="text-sm font-bold text-espresso">Weekly Digest</h3>
            <p className="text-[11px] text-muted">
                {currentDigest.weekStart} → {currentDigest.weekEnd}
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
        <Card className="border-sage/15 bg-white/60">
          <CardContent className="p-3">
            <MiniStat label="Feeds" value={currentDigest.thisWeek?.feeds?.perDay} unit="/d" />
          </CardContent>
        </Card>
        <Card className="border-sage/15 bg-white/60">
          <CardContent className="p-3">
            <MiniStat label="Diapers" value={currentDigest.thisWeek?.diapers?.perDay} unit="/d" />
          </CardContent>
        </Card>
        <Card className="border-sage/15 bg-white/60">
          <CardContent className="p-3">
            <MiniStat label="Sleep" value={currentDigest.thisWeek?.sleep?.avgPerDay} unit="h/d" />
          </CardContent>
        </Card>
        <Card className="border-sage/15 bg-white/60">
          <CardContent className="p-3">
            <MiniStat label="Meds" value={`${currentDigest.thisWeek?.meds?.adherence}%`} />
          </CardContent>
        </Card>
      </div>

      {/* Expandable AI summary */}
      {expanded && (
        <Card className="mt-3 border-sage/10 bg-white/40">
          <CardContent className="p-4 pt-3">
            <DigestMarkdown content={currentDigest.summary} />
          </CardContent>
        </Card>
      )}

      {!expanded && currentDigest.summary && (
        <p className="text-[12px] text-muted line-clamp-2 mt-2">{currentDigest.summary.slice(0, 120)}...</p>
      )}
    </div>
        );
      }}
    </DataState>
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
