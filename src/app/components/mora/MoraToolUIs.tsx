"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const WRITE_TOOLS = [
  "create_event",
  "update_event",
  "delete_event",
  "create_note",
  "create_reminder",
  "update_reminder",
  "delete_reminder",
] as const;

const READ_TOOLS = [
  "get_baby_profile",
  "get_recent_events",
  "get_historic_events",
  "get_daily_summary",
  "get_range_summary",
  "get_reminders",
  "get_last_events_by_type",
  "search_records",
] as const;

function ReadToolUI({ name, status, result }: { name: string; status: string; result: any }) {
  const isDone = status === "complete";
  return (
    <div className="my-2 rounded-xl border border-sage/15 bg-sage/5 p-3 text-[12px]">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${isDone ? "bg-sage" : "bg-sage animate-pulse"}`} />
        <span className="font-semibold text-espresso">{formatName(name)}</span>
        <span className="text-muted">&middot; {isDone ? "Done" : "Fetching..."}</span>
      </div>
    </div>
  );
}

function WriteToolUI({ name, args, status, result }: { name: string; args: any; status: string; result: any }) {
  const isDone = status === "complete";
  const resultObj = typeof result === "string" ? tryParse(result) : result;

  const isPendingApproval = resultObj?.status === "pending_approval";
  const wasExecuted = resultObj?.status === "executed";
  const wasBlocked = resultObj?.status === "blocked";

  const preview = args?.preview ?? resultObj?.preview ?? formatName(name);
  const isDelete = name.includes("delete");
  const isUpdate = name.includes("update");

  const riskColor = isDelete
    ? "border-alert-red/20 bg-alert-red/5"
    : isUpdate
    ? "border-night/10 bg-night/5"
    : "border-sage/20 bg-sage/5";

  const badgeColor = isDelete
    ? "bg-alert-red/10 text-alert-red border-alert-red/20"
    : isUpdate
    ? "bg-night/10 text-night border-night/15"
    : "bg-sage/10 text-sage border-sage/20";

  return (
    <div className={`my-2 rounded-xl border p-3 text-[12px] ${riskColor}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${isDone ? "bg-sage" : "bg-clay animate-pulse"}`} />
          <span className="font-semibold text-espresso">{preview}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeColor}`}>
          {name.split("_").pop()}
        </span>
      </div>

      {!isDone && (
        <p className="text-muted">Processing...</p>
      )}

      {isPendingApproval && (
        <ApprovalButtons actionId={resultObj.actionId} threadId={resultObj.threadId} />
      )}

      {wasExecuted && (
        <p className="text-sage font-medium mt-1">Applied successfully.</p>
      )}

      {wasBlocked && (
        <p className="text-alert-red mt-1">{resultObj.reason}</p>
      )}
    </div>
  );
}

function ApprovalButtons({ actionId }: { actionId: string; threadId?: string }) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const approve = useMutation(api.mora.approveMoraAction);
  const reject = useMutation(api.mora.rejectMoraAction);
  const execute = useMutation(api.mora.executeApprovedMoraAction);

  const handleApprove = async () => {
    setBusy("approve");
    try {
      await approve({ actionId: actionId as any });
      await execute({ actionId: actionId as any });
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy("reject");
    try {
      await reject({ actionId: actionId as any, reason: "Rejected in sidebar" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReject}
        disabled={busy !== null}
        className="h-7 text-[11px]"
      >
        {busy === "reject" ? "..." : "Reject"}
      </Button>
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={busy !== null}
        className="h-7 text-[11px]"
      >
        {busy === "approve" ? "Applying..." : "Approve"}
      </Button>
    </div>
  );
}

function formatName(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function tryParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}

const toolUIs = [
  ...READ_TOOLS.map((toolName) =>
    makeAssistantToolUI({
      toolName,
      render: ({ status, result }) => (
        <ReadToolUI name={toolName} status={status.type} result={result} />
      ),
    })
  ),
  ...WRITE_TOOLS.map((toolName) =>
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
