"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

interface MoraApprovalCardProps {
  action: any;
  onAfterAction?: () => void;
}

export default function MoraApprovalCard({ action, onAfterAction }: MoraApprovalCardProps) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const approve = useMutation(api.mora.approveMoraAction);
  const reject = useMutation(api.mora.rejectMoraAction);
  const execute = useMutation(api.mora.executeApprovedMoraAction);
  const createMessage = useMutation(api.mora.createMoraMessage);

  const handleApprove = async () => {
    setBusy("approve");
    try {
      await approve({ actionId: action._id });
      const result = await execute({ actionId: action._id });
      await createMessage({
        threadId: action.threadId,
        role: "assistant",
        parts: [{ type: "text", text: result.summary }],
        text: result.summary,
      });
      onAfterAction?.();
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy("reject");
    try {
      await reject({ actionId: action._id, reason: "Rejected in Mora sidebar" });
      await createMessage({
        threadId: action.threadId,
        role: "assistant",
        parts: [{ type: "text", text: `Action rejected: ${action.preview}` }],
        text: `Action rejected: ${action.preview}`,
      });
      onAfterAction?.();
    } finally {
      setBusy(null);
    }
  };

  const riskTone =
    action.actionType.includes("delete")
      ? "text-alert-red bg-alert-red/8 border-alert-red/20"
      : action.actionType.includes("update")
      ? "text-night bg-night/5 border-night/10"
      : "text-sage bg-sage/8 border-sage/20";

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-espresso">Approval Required</div>
          <div className="text-xs text-muted mt-1">{action.preview}</div>
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${riskTone}`}>
          {action.actionType.split(".")[1] ?? "action"}
        </span>
      </div>
      <pre className="text-[11px] leading-relaxed text-muted bg-oat/60 border border-black/5 rounded-xl p-3 overflow-x-auto">
        {JSON.stringify(action.payload, null, 2)}
      </pre>
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
