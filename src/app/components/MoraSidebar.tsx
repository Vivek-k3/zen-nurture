"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DefaultChatTransport, UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import MoraComposer from "./MoraComposer";
import MoraMessageList from "./MoraMessageList";
import MoraApprovalCard from "./MoraApprovalCard";
import { Button } from "@/components/ui/button";

interface MoraSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function getPageLabel(pathname: string): "Today" | "Trends" | "Records" | "Reminders" | "Settings" | "Unknown" {
  if (pathname === "/") return "Today";
  if (pathname.startsWith("/trends")) return "Trends";
  if (pathname.startsWith("/records")) return "Records";
  if (pathname.startsWith("/reminders")) return "Reminders";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Unknown";
}

export default function MoraSidebar({ isOpen, onClose }: MoraSidebarProps) {
  const pathname = usePathname() ?? "/";
  const pageLabel = getPageLabel(pathname);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [hydratedFromConvex, setHydratedFromConvex] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const settings = useQuery(api.mora.getMoraSettings, {});
  const babyProfile = useQuery(api.events.getBabyProfile, {});
  const createThread = useMutation(api.mora.getOrCreateMoraThread);
  const createMessage = useMutation(api.mora.createMoraMessage);

  const messagesPage = useQuery(
    api.mora.listMoraMessages,
    threadId ? { threadId: threadId as any, limit: 200 } : "skip"
  );

  const pendingActions = useQuery(
    api.mora.listPendingMoraActions,
    threadId ? { threadId: threadId as any } : "skip"
  );
  const convexMessages = messagesPage?.page ?? [];
  const convexMessagesSignature = convexMessages.map((m: any) => String(m._id)).join("|");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/mora",
        body: {
          threadId,
          clientContext: {
            pathname,
            pageLabel,
            timestamp: new Date().toISOString(),
          },
        },
      }),
    [threadId, pathname, pageLabel]
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
    onFinish: async ({ message }) => {
      if (!threadId) return;
      const text = (message.parts || [])
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("\n");
      await createMessage({
        threadId: threadId as any,
        role: "assistant",
        parts: message.parts,
        text: text || undefined,
        routeContext: { pathname, pageLabel },
      });
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void (async () => {
      if (threadId) return;
      const thread = await createThread({
        babyId: babyProfile?._id,
      } as any);
      if (!active) return;
      if (!thread?._id) return;
      setThreadId(thread._id);
    })();
    return () => {
      active = false;
    };
  }, [isOpen, threadId, createThread, babyProfile?._id]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || convexMessages.length === 0 || hydratedFromConvex || messages.length > 0) return;
    const seeded = convexMessages.map((m: any) => ({
      id: String(m._id),
      role: m.role,
      parts: Array.isArray(m.parts) ? m.parts : [{ type: "text", text: m.text || "" }],
    })) as UIMessage[];
    setMessages(seeded);
    setHydratedFromConvex(true);
  }, [isOpen, convexMessagesSignature, hydratedFromConvex, messages.length, setMessages]);

  const quickPrompts = {
    Today: [
      "Summarize the last 24h and tell me what to log next.",
      "What is the latest feed, diaper, and sleep status?",
    ],
    Trends: [
      "Analyze the last 7 days for feeding and diaper trends.",
      "What patterns should we monitor this week?",
    ],
    Reminders: [
      "Create a daily vitamin reminder at 9:00 AM.",
      "Show upcoming reminders and suggest improvements.",
    ],
    Records: [
      "Summarize recent notable notes and meds events.",
      "Find all notes mentioning rash in the last 30 days.",
    ],
    Settings: [
      "Explain YOLO mode and recommend a safe default.",
      "What can Mora update automatically right now?",
    ],
    Unknown: ["What can you help me with in Zen Nurture?"],
  }[pageLabel];

  const isBusy = status === "submitted" || status === "streaming";

  const handleSend = async (text: string) => {
    if (!threadId) return;

    await createMessage({
      threadId: threadId as any,
      role: "user",
      parts: [{ type: "text", text }],
      text,
      routeContext: { pathname, pageLabel },
    });

    await sendMessage({ text });
  };

  if (!isOpen) return null;

  const moraEnabled = settings?.enabled ?? true;
  const yoloOn = settings?.yoloMode ?? false;

  return (
    <>
      <button
        type="button"
        aria-label="Close Mora sidebar"
        className="fixed inset-0 z-40 bg-espresso/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside
        id="mora-sidebar"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mora AI Assistant"
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[520px] bg-[#FEFCF8] shadow-2xl border-l border-black/5 flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="mora-panel-grid border-b border-black/5 px-4 md:px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-white/85 border border-sage/15 shadow-sm flex items-center justify-center text-sage">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-espresso tracking-tight">Mora</h2>
                  <p className="text-[11px] text-muted">AI caregiver copilot for {pageLabel}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full bg-white/80 border border-black/5 text-[10px] font-bold text-muted uppercase">
                Live
              </span>
              <span
                className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                  yoloOn ? "bg-alert-red/8 text-alert-red border-alert-red/20" : "bg-sage/8 text-sage border-sage/20"
                }`}
              >
                {yoloOn ? "YOLO ON" : "YOLO OFF"}
              </span>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close Mora">
                <span className="material-symbols-outlined">close</span>
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={!moraEnabled || isBusy}
                onClick={() => void handleSend(prompt)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-white/70 bg-white/70 text-espresso hover:bg-white disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!moraEnabled ? (
            <div className="p-4">
              <div className="rounded-2xl border border-alert-red/15 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-espresso mb-1">Mora is disabled</h3>
                <p className="text-[13px] text-muted mb-3">
                  Enable Mora in Settings to use chat, data insights, and approval-based actions.
                </p>
                <a
                  href="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-espresso text-oat text-[12px] font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Open Settings
                </a>
              </div>
            </div>
          ) : (
            <>
              {pendingActions && pendingActions.length > 0 && (
                <div className="px-4 pt-4 space-y-3">
                  {pendingActions.map((action: any) => (
                    <MoraApprovalCard key={action._id} action={action} onAfterAction={() => setHydratedFromConvex(false)} />
                  ))}
                </div>
              )}
              <MoraMessageList messages={messages} />
              {error && (
                <div className="px-4 pb-4">
                  <div className="rounded-xl border border-alert-red/20 bg-alert-red/5 p-3 text-[13px] text-alert-red">
                    {error.message}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <MoraComposer disabled={!moraEnabled || !threadId} busy={isBusy} onSend={handleSend} />
      </aside>
    </>
  );
}
