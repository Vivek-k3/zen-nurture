"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface MoraAction {
  _id: string;
  actionType?: string;
  preview?: string;
  payload?: unknown;
}

interface MoraApprovalCardProps {
  action: MoraAction;
}

export default function MoraApprovalCard({ action }: MoraApprovalCardProps) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const approve = useMutation(api.mora.approveMoraAction);
  const reject = useMutation(api.mora.rejectMoraAction);

  const actionType = action.actionType ?? "";

  const handleApprove = async () => {
    setBusy("approve");
    setError(null);
    try {
      // approveMoraAction applies the change and notes the result in the thread.
      await approve({ actionId: action._id as Id<"moraActions"> });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy("reject");
    setError(null);
    try {
      await reject({
        actionId: action._id as Id<"moraActions">,
        reason: "Rejected in Mora sidebar",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
      setBusy(null);
    }
  };

  const riskTone = actionType.includes("delete")
    ? "text-alert-red bg-alert-red/8 border-alert-red/20"
    : actionType.includes("update")
    ? "text-night bg-night/5 border-night/10"
    : "text-sage bg-sage/8 border-sage/20";

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-espresso">Approval Required</div>
          {action.preview && <div className="text-xs text-muted mt-1">{action.preview}</div>}
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${riskTone}`}>
          {actionType.split(".")[1] ?? "action"}
        </span>
      </div>

      {action.payload != null && (
        <pre className="text-[11px] leading-relaxed text-muted bg-oat/60 border border-black/5 rounded-xl p-3 overflow-x-auto">
          {JSON.stringify(action.payload, null, 2)}
        </pre>
      )}

      {error && <p className="text-[11px] text-alert-red mt-2">{error}</p>}

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={handleReject} disabled={busy !== null}>
          {busy === "reject" ? "Rejecting..." : "Reject"}
        </Button>
        <Button size="sm" onClick={handleApprove} disabled={busy !== null}>
          {busy === "approve" ? "Applying..." : "Approve & Apply"}
        </Button>
      </div>
    </div>
  );
}
