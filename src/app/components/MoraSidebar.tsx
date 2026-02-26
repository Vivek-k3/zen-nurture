"use client";

import { useEffect, useRef, useMemo } from "react";

import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import MoraOrb from "@/components/MoraOrb";
import MoraThread from "./mora/MoraThread";
import MoraToolUIs from "./mora/MoraToolUIs";

interface MoraSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function getPageLabel(pathname: string) {
  if (pathname === "/") return "Today";
  if (pathname.startsWith("/trends")) return "Trends";
  if (pathname.startsWith("/records")) return "Records";
  if (pathname.startsWith("/reminders")) return "Reminders";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Unknown";
}

const QUICK_PROMPTS: Record<string, string[]> = {
  Today: [
    "Summarize the last 24h",
    "What should I log next?",
  ],
  Trends: [
    "Analyze last 7 days",
    "Any feeding patterns?",
  ],
  Reminders: [
    "Show upcoming reminders",
    "Create a 9 AM vitamin reminder",
  ],
  Records: [
    "Find notes about rash",
    "Summarize recent meds",
  ],
  Settings: [
    "Explain YOLO mode",
    "What can Mora update?",
  ],
  Unknown: ["What can you help with?"],
};

function MoraRuntimeProvider({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const pageLabel = getPageLabel(pathname);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/mora",
        body: {
          clientContext: {
            pathname,
            pageLabel,
            timestamp: new Date().toISOString(),
          },
        },
      }),
    [pathname, pageLabel]
  );

  const runtime = useChatRuntime({ transport });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MoraToolUIs />
      {children}
    </AssistantRuntimeProvider>
  );
}

export default function MoraSidebar({ isOpen, onClose }: MoraSidebarProps) {
  const pathname = usePathname() ?? "/";
  const pageLabel = getPageLabel(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const settings = useQuery(api.mora.getMoraSettings, {});

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const moraEnabled = settings?.enabled ?? true;
  const yoloOn = settings?.yoloMode ?? false;
  const prompts = QUICK_PROMPTS[pageLabel] ?? QUICK_PROMPTS.Unknown;

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
        {/* Header */}
        <div className="border-b border-black/5 px-4 md:px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <MoraOrb size="sm" state="idle" />
              <div>
                <h2 className="text-base font-semibold text-espresso tracking-tight">Mora</h2>
                <p className="text-[11px] text-muted">AI copilot &middot; {pageLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                yoloOn ? "bg-alert-red/8 text-alert-red border-alert-red/20" : "bg-sage/8 text-sage border-sage/20"
              }`}>
                {yoloOn ? "YOLO" : "Safe"}
              </span>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close Mora" className="h-8 w-8">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Body */}
        {!moraEnabled ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="rounded-2xl border border-alert-red/15 bg-white p-6 shadow-sm text-center max-w-xs">
              <MoraOrb size="lg" state="idle" className="mx-auto mb-3" />
              <h3 className="font-semibold text-espresso mb-1">Mora is disabled</h3>
              <p className="text-[13px] text-muted mb-4">
                Enable Mora in Settings to use the AI assistant.
              </p>
              <a
                href="/settings"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-espresso text-oat text-[12px] font-semibold"
              >
                Open Settings
              </a>
            </div>
          </div>
        ) : (
          <MoraRuntimeProvider pathname={pathname}>
            <MoraThread quickPrompts={prompts} />
          </MoraRuntimeProvider>
        )}
      </aside>
    </>
  );
}
