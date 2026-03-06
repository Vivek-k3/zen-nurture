"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import MoraOrb from "@/components/MoraOrb";
import { ShimmeringText } from "@/components/shimmering-text/shimmering-text";

const EVENT_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  FEED_BOTTLE: { icon: "water_drop", color: "text-sage", label: "Bottle Feed" },
  FEED_BREAST: { icon: "water_drop", color: "text-sage", label: "Breast Feed" },
  PUMP: { icon: "water_drop", color: "text-sage", label: "Pump" },
  DIAPER: { icon: "baby_changing_station", color: "text-clay", label: "Diaper" },
  SLEEP: { icon: "bedtime", color: "text-night", label: "Sleep" },
  MED_DOSE: { icon: "medication", color: "text-alert-red", label: "Medicine" },
  NOTE: { icon: "sticky_note_2", color: "text-dusty-blue", label: "Note" },
  GROWTH: { icon: "straighten", color: "text-sage", label: "Growth" },
};

function getEventMeta(type?: string) {
  if (!type) return { icon: "event", color: "text-muted", label: "Event" };
  return EVENT_ICONS[type] ?? { icon: "event", color: "text-muted", label: type };
}

/* ---------- Read Tool UI ---------- */

function getReadToolLoadingMessage(name: string, args?: Record<string, unknown>): string {
  const days = args?.from && args?.to
    ? Math.ceil((new Date(args.to as string).getTime() - new Date(args.from as string).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const hours = typeof args?.hours === "number" ? args.hours : null;
  const map: Record<string, string> = {
    get_baby_age: "Calculating baby's age",
    get_baby_profile: "Reading baby profile",
    get_last_24h_summary: "Summarizing last 24 hours",
    get_recent_events: hours ? `Reading last ${hours}h of events` : "Reading feed history",
    get_historic_events: days ? `Fetching last ${days} days data` : "Fetching historic events",
    get_daily_summary: "Fetching daily summary",
    get_range_summary: days ? `Fetching last ${days} days summary` : "Fetching range summary",
    get_reminders: "Fetching reminders",
    get_last_events_by_type: "Fetching latest events",
    search_records: "Searching records",
  };
  return map[name] ?? `Reading ${formatName(name).toLowerCase()}`;
}

function ReadToolUI({ name, status, args }: { name: string; status: string; args?: Record<string, unknown> }) {
  const isDone = status === "complete";
  const loadingMsg = getReadToolLoadingMessage(name, args);
  return (
    <div className="my-1.5 flex items-center gap-2 text-[11px]">
      {isDone ? (
        <span className="material-symbols-outlined text-sage text-[14px]">check_circle</span>
      ) : (
        <MoraOrb size="xs" state="thinking" />
      )}
      <span className="rounded-md bg-black/5 px-2 py-0.5 text-muted">
        {isDone ? formatName(name) : <ShimmeringText text={loadingMsg} duration={1.5} className="[--color:var(--sage)] [--shimmering-color:var(--espresso)]" />}
      </span>
    </div>
  );
}

/* ---------- Create Event Tool UI ---------- */

function CreateEventUI({ args, status, result }: { args: any; status: string; result: any }) {
  const isDone = status === "complete";
  const resultObj = normalize(result);
  const eventType = args?.type ?? "";
  const meta = getEventMeta(eventType);
  const payload = args?.payload ?? {};

  const detailParts: string[] = [];
  if (payload.amountMl) detailParts.push(`${payload.amountMl}ml`);
  if (payload.durationMin) detailParts.push(`${payload.durationMin}min`);
  if (payload.side) detailParts.push(payload.side);
  if (payload.kind) detailParts.push(payload.kind);
  if (payload.medicineName) detailParts.push(payload.medicineName);
  if (payload.text) detailParts.push(payload.text.slice(0, 60));
  if (payload.weightKg) detailParts.push(`${payload.weightKg}kg`);
  if (payload.heightCm) detailParts.push(`${payload.heightCm}cm`);
  if (payload.headCm) detailParts.push(`head ${payload.headCm}cm`);
  const detail = detailParts.join(" · ") || args?.preview || "";

  return (
    <div className="my-1.5 rounded-md bg-black/5 p-2 text-[12px]">
      <div className="flex items-center gap-2 mb-1">
        <span className={`material-symbols-outlined text-[16px] ${meta.color}`}>{meta.icon}</span>
        <p className="font-medium text-espresso">{meta.label}</p>
        {detail && <p className="text-muted truncate text-[11px]">{detail}</p>}
      </div>

      {!isDone && <StatusPill label="Processing..." spinning />}
      {isDone && <WriteResult resultObj={resultObj} />}
    </div>
  );
}

/* ---------- Generic Write Tool UI ---------- */

function WriteToolUI({ name, args, status, result }: { name: string; args: any; status: string; result: any }) {
  const isDone = status === "complete";
  const resultObj = normalize(result);
  const preview = args?.preview ?? resultObj?.preview ?? formatName(name);
  const isDelete = name.includes("delete");
  const isUpdate = name.includes("update");

  const badgeColor = isDelete
    ? "bg-alert-red/10 text-alert-red border-alert-red/20"
    : isUpdate
    ? "bg-night/10 text-night border-night/15"
    : "bg-sage/10 text-sage border-sage/20";
  const actionLabel = name.split("_").pop() ?? "action";

  return (
    <div className="my-1.5 rounded-md bg-black/5 p-2 text-[12px]">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="font-medium text-espresso">{preview}</p>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${badgeColor}`}>
          {actionLabel}
        </span>
      </div>

      {!isDone && <StatusPill label="Processing..." spinning />}
      {isDone && <WriteResult resultObj={resultObj} />}
    </div>
  );
}

/* ---------- Shared: Write Result with Human-in-the-Loop ---------- */

function WriteResult({ resultObj }: { resultObj: any }) {
  if (!resultObj) return null;

  if (resultObj.status === "pending_approval") {
    return <ApprovalCard actionId={resultObj.actionId} preview={resultObj.preview} />;
  }
  if (resultObj.status === "executed") {
    return (
      <div className="flex items-center gap-1.5 text-sage font-medium">
        <span className="material-symbols-outlined text-[16px]">check_circle</span>
        Applied
      </div>
    );
  }
  if (resultObj.status === "blocked") {
    return (
      <div className="flex items-center gap-1.5 text-alert-red">
        <span className="material-symbols-outlined text-[16px]">block</span>
        {resultObj.reason}
      </div>
    );
  }
  return null;
}

/* ---------- Approval Card (Human-in-the-Loop Yes/No) ---------- */

function ApprovalCard({ actionId, preview }: { actionId: string; preview?: string }) {
  const [outcome, setOutcome] = useState<"approved" | "rejected" | null>(null);
  const [busy, setBusy] = useState(false);
  const approve = useMutation(api.mora.approveMoraAction);
  const reject = useMutation(api.mora.rejectMoraAction);
  const execute = useMutation(api.mora.executeApprovedMoraAction);

  if (outcome === "approved") {
    return (
      <div className="flex items-center gap-1.5 text-sage font-medium">
        <span className="material-symbols-outlined text-[16px]">check_circle</span>
        Approved &amp; applied
      </div>
    );
  }
  if (outcome === "rejected") {
    return (
      <div className="flex items-center gap-1.5 text-muted">
        <span className="material-symbols-outlined text-[16px]">cancel</span>
        Rejected
      </div>
    );
  }

  const handleApprove = async () => {
    setBusy(true);
    try {
      await approve({ actionId: actionId as any });
      await execute({ actionId: actionId as any });
      setOutcome("approved");
    } catch { setBusy(false); }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await reject({ actionId: actionId as any, reason: "Rejected in Mora" });
      setOutcome("rejected");
    } catch { setBusy(false); }
  };

  return (
    <div className="mt-1 p-2 rounded-md bg-black/5">
      <p className="text-[11px] text-muted mb-2">
        {preview ? `"${preview}" — ` : ""}Approve this action?
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          disabled={busy}
          className="h-7 text-[11px] gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
          No
        </Button>
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={busy}
          className="h-7 text-[11px] gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">check</span>
          {busy ? "Applying..." : "Yes, apply"}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function StatusPill({ label, spinning }: { label: string; spinning?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-muted">
      {spinning ? <MoraOrb size="xs" state="thinking" /> : null}
      <span>
        {spinning ? (
          <ShimmeringText text={label} duration={1.5} className="[--color:var(--sage)] [--shimmering-color:var(--espresso)]" />
        ) : (
          label
        )}
      </span>
    </div>
  );
}

function formatName(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalize(result: any) {
  if (!result) return null;
  if (typeof result === "string") {
    try { return JSON.parse(result); } catch { return null; }
  }
  return result;
}

/* ---------- Tool UI Registration ---------- */

const READ_TOOLS = [
  "get_baby_age", "get_baby_profile", "get_last_24h_summary", "get_recent_events", "get_historic_events",
  "get_daily_summary", "get_range_summary", "get_reminders",
  "get_last_events_by_type", "search_records", "analyze_patterns",
  "generate_weekly_digest", "check_nudges",
] as const;

function PatternAnalysisUI({ status, result }: { status: string; result: any }) {
  const isDone = status === "complete";
  const data = normalize(result);
  const patterns = data?.patterns;

  if (!isDone) {
    return (
      <div className="my-1.5 flex items-center gap-2 text-[11px]">
        <MoraOrb size="xs" state="thinking" />
        <span className="rounded-md bg-black/5 px-2 py-0.5">
          <ShimmeringText text="Analyzing patterns..." duration={1.5} className="[--color:var(--sage)] [--shimmering-color:var(--espresso)]" />
        </span>
      </div>
    );
  }

  if (!patterns || Object.keys(patterns).length === 0) {
    return (
      <div className="my-1.5 text-[11px] text-muted">
        No pattern data found.
      </div>
    );
  }

  return (
    <div className="my-1.5 rounded-md bg-black/5 p-2 text-[12px] space-y-1.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-sage text-[16px]">insights</span>
        <span className="font-semibold text-espresso">Pattern Analysis</span>
      </div>
      {Object.entries(patterns).map(([type, info]: [string, any]) => {
        if (!info.avgIntervalHours) return null;
        const label = type.replace(/_/g, " ").toLowerCase();
        return (
          <div key={type} className="flex items-center justify-between gap-2 py-1 border-b border-muted/5 last:border-0">
            <span className="text-espresso capitalize">{label}</span>
            <div className="text-right text-muted">
              <span className="font-mono font-semibold text-espresso">{info.avgIntervalHours}h</span> avg
              <span className="text-muted/50 mx-1">·</span>
              {info.perDay}/day
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DigestUI({ status, result }: { status: string; result: any }) {
  const isDone = status === "complete";
  const data = normalize(result);

  if (!isDone) {
    return (
      <div className="my-1.5 flex items-center gap-2 text-[11px]">
        <MoraOrb size="xs" state="thinking" />
        <span className="rounded-md bg-black/5 px-2 py-0.5">
          <ShimmeringText text="Generating weekly digest..." duration={1.5} className="[--color:var(--sage)] [--shimmering-color:var(--espresso)]" />
        </span>
      </div>
    );
  }

  if (!data?.thisWeek || !data?.lastWeek) {
    return (
      <div className="my-1.5 text-[11px] text-muted">
        No data available for digest.
      </div>
    );
  }

  const tw = data.thisWeek;
  const lw = data.lastWeek;

  return (
    <div className="my-1.5 rounded-md bg-black/5 p-2 text-[12px] space-y-1.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-sage text-[16px]">summarize</span>
        <span className="font-semibold text-espresso">Weekly Comparison</span>
        <span className="text-muted text-[10px] ml-auto">{tw.from} → {tw.to}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <CompStat label="Feeds/day" current={tw.feeds.perDay} previous={lw.feeds.perDay} />
        <CompStat label="Intake/day" current={Math.round(tw.feeds.totalMl / Math.max(1, daysBetween(tw.from, tw.to)))} previous={Math.round(lw.feeds.totalMl / Math.max(1, daysBetween(lw.from, lw.to)))} unit="ml" />
        <CompStat label="Diapers/day" current={tw.diapers.perDay} previous={lw.diapers.perDay} />
        <CompStat label="Sleep/day" current={tw.sleep.avgPerDay} previous={lw.sleep.avgPerDay} unit="h" />
        <CompStat label="Meds adh." current={tw.meds.adherence} previous={lw.meds.adherence} unit="%" />
        <div className="text-center py-1">
          <p className="text-[10px] text-muted">Events</p>
          <p className="font-mono font-bold text-espresso">{tw.totalEvents}</p>
        </div>
      </div>
    </div>
  );
}

function CompStat({ label, current, previous, unit = "" }: { label: string; current: number; previous: number; unit?: string }) {
  const diff = current - previous;
  const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
  const color = diff > 0 ? "text-sage" : diff < 0 ? "text-alert-red" : "text-muted";

  return (
    <div className="py-1">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="font-mono font-bold text-espresso">{current}{unit}</p>
      <p className={`text-[10px] font-semibold ${color}`}>{arrow} {Math.abs(Math.round(diff * 10) / 10)}{unit}</p>
    </div>
  );
}

function daysBetween(from: string, to: string) {
  return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function NudgesUI({ status, result }: { status: string; result: any }) {
  const isDone = status === "complete";
  const data = normalize(result);
  const nudges = Array.isArray(data) ? data : data?.nudges ?? data ?? [];

  if (!isDone) {
    return (
      <div className="my-1.5 flex items-center gap-2 text-[11px]">
        <MoraOrb size="xs" state="thinking" />
        <span className="rounded-md bg-black/5 px-2 py-0.5">
          <ShimmeringText text="Checking for anomalies..." duration={1.5} className="[--color:var(--sage)] [--shimmering-color:var(--espresso)]" />
        </span>
      </div>
    );
  }

  if (!Array.isArray(nudges) || nudges.length === 0) {
    return (
      <div className="my-1.5 text-[12px] flex items-center gap-2 text-muted">
        <span className="material-symbols-outlined text-sage text-[16px]">check_circle</span>
        <span className="font-medium text-espresso">All on track — no unusual gaps detected.</span>
      </div>
    );
  }

  const severityColors: Record<string, string> = {
    info: "bg-sage/5",
    warn: "bg-clay/5",
    alert: "bg-alert-red/5",
  };

  return (
    <div className="my-1.5 space-y-1">
      {nudges.map((n: any) => (
        <div key={`${n.id ?? n.title ?? "nudge"}:${n.severity ?? "info"}:${n.body ?? ""}`} className={`rounded-md px-2 py-1 text-[12px] flex items-center gap-2 ${severityColors[n.severity] ?? "bg-black/5"}`}>
          <span className="material-symbols-outlined text-[14px]">{n.icon ?? "info"}</span>
          <div>
            <span className="font-medium text-espresso">{n.title}</span>
            <span className="text-muted ml-1">{n.body}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const CUSTOM_TOOL_NAMES = ["analyze_patterns", "generate_weekly_digest", "check_nudges"];

const toolUIEntries = [
  ...READ_TOOLS.filter((t) => !CUSTOM_TOOL_NAMES.includes(t)).map((toolName) =>
    ({
      key: toolName,
      ToolUI: makeAssistantToolUI({
        toolName,
        render: ({ status, args }) => <ReadToolUI name={toolName} status={status.type} args={args} />,
      }),
    })
  ),
  {
    key: "analyze_patterns",
    ToolUI: makeAssistantToolUI({
      toolName: "analyze_patterns",
      render: ({ status, result }) => <PatternAnalysisUI status={status.type} result={result} />,
    }),
  },
  {
    key: "generate_weekly_digest",
    ToolUI: makeAssistantToolUI({
      toolName: "generate_weekly_digest",
      render: ({ status, result }) => <DigestUI status={status.type} result={result} />,
    }),
  },
  {
    key: "check_nudges",
    ToolUI: makeAssistantToolUI({
      toolName: "check_nudges",
      render: ({ status, result }) => <NudgesUI status={status.type} result={result} />,
    }),
  },
  {
    key: "create_event",
    ToolUI: makeAssistantToolUI({
      toolName: "create_event",
      render: ({ args, status, result }) => (
        <CreateEventUI args={args} status={status.type} result={result} />
      ),
    }),
  },
  {
    key: "create_note",
    ToolUI: makeAssistantToolUI({
      toolName: "create_note",
      render: ({ args, status, result }) => (
        <CreateEventUI args={{ type: "NOTE", payload: { text: args?.text }, preview: String(args?.text ?? "").slice(0, 60) }} status={status.type} result={result} />
      ),
    }),
  },
  ...["update_event", "delete_event", "create_reminder", "update_reminder", "delete_reminder"].map(
    (toolName) =>
      ({
        key: toolName,
        ToolUI: makeAssistantToolUI({
          toolName,
          render: ({ args, status, result }) => (
            <WriteToolUI name={toolName} args={args} status={status.type} result={result} />
          ),
        }),
      })
  ),
];

export default function MoraToolUIs() {
  return <>{toolUIEntries.map(({ key, ToolUI }) => <ToolUI key={key} />)}</>;
}
