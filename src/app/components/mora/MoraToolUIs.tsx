"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import MoraOrb from "@/components/MoraOrb";

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

function ReadToolUI({ name, status }: { name: string; status: string }) {
  const isDone = status === "complete";
  return (
    <div className="my-2 rounded-xl border border-sage/15 bg-sage/5 px-3 py-2 text-[12px] flex items-center gap-2">
      {isDone ? (
        <span className="material-symbols-outlined text-sage text-[16px]">check_circle</span>
      ) : (
        <MoraOrb size="xs" state="thinking" />
      )}
      <span className="font-medium text-espresso">{formatName(name)}</span>
      <span className="text-muted">&middot; {isDone ? "Done" : "Fetching..."}</span>
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
  const detail = detailParts.join(" · ") || args?.preview || "";

  return (
    <div className="my-2 rounded-xl border border-sage/20 bg-white p-3 shadow-sm text-[12px]">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`h-8 w-8 rounded-lg bg-oat flex items-center justify-center ${meta.color}`}>
          <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-espresso">{meta.label}</p>
          {detail && <p className="text-muted truncate">{detail}</p>}
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-sage/20 bg-sage/10 text-sage">
          create
        </span>
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

  const borderColor = isDelete ? "border-alert-red/20" : isUpdate ? "border-night/10" : "border-sage/20";
  const bgColor = isDelete ? "bg-alert-red/5" : isUpdate ? "bg-night/5" : "bg-white";
  const badgeColor = isDelete
    ? "bg-alert-red/10 text-alert-red border-alert-red/20"
    : isUpdate
    ? "bg-night/10 text-night border-night/15"
    : "bg-sage/10 text-sage border-sage/20";
  const actionLabel = name.split("_").pop() ?? "action";

  return (
    <div className={`my-2 rounded-xl border p-3 shadow-sm text-[12px] ${borderColor} ${bgColor}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="font-semibold text-espresso">{preview}</p>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeColor}`}>
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
    <div className="mt-1.5 p-2.5 rounded-lg bg-oat/60 border border-black/5">
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
      <span>{label}</span>
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
  "get_baby_profile", "get_recent_events", "get_historic_events",
  "get_daily_summary", "get_range_summary", "get_reminders",
  "get_last_events_by_type", "search_records",
] as const;

const toolUIs = [
  ...READ_TOOLS.map((toolName) =>
    makeAssistantToolUI({
      toolName,
      render: ({ status }) => <ReadToolUI name={toolName} status={status.type} />,
    })
  ),
  makeAssistantToolUI({
    toolName: "create_event",
    render: ({ args, status, result }) => (
      <CreateEventUI args={args} status={status.type} result={result} />
    ),
  }),
  makeAssistantToolUI({
    toolName: "create_note",
    render: ({ args, status, result }) => (
      <CreateEventUI args={{ type: "NOTE", payload: { text: args?.text }, preview: String(args?.text ?? "").slice(0, 60) }} status={status.type} result={result} />
    ),
  }),
  ...["update_event", "delete_event", "create_reminder", "update_reminder", "delete_reminder"].map(
    (toolName) =>
      makeAssistantToolUI({
        toolName,
        render: ({ args, status, result }) => (
          <WriteToolUI name={toolName} args={args} status={status.type} result={result} />
        ),
      })
  ),
];

export default function MoraToolUIs() {
  return <>{toolUIs.map((ToolUI, i) => <ToolUI key={i} />)}</>;
}
