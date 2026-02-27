"use client";

import { UIMessage } from "ai";

interface MoraMessageListProps {
  messages: UIMessage[];
}

function extractText(message: UIMessage) {
  return (message.parts || [])
    .map((part: any) => {
      if (part.type === "text") return part.text;
      if (part.type?.startsWith?.("tool-") || part.type === "tool-call" || part.type === "tool-result") {
        return typeof part.output === "string" ? part.output : "";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export default function MoraMessageList({ messages }: MoraMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="p-4 space-y-3">
        <div className="rounded-2xl border border-sage/15 bg-white/70 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-sage/15 text-sage flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
            </div>
            <div className="text-[13px] font-semibold text-espresso">Mora</div>
          </div>
          <p className="text-[13px] text-muted leading-relaxed">
            Ask for live summaries, trends, reminder planning, or event corrections. I will ask for approval before changes unless YOLO mode is enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const text = extractText(message) || "(no text)";
        return (
          <div
            key={message.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-300`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm border ${
                isUser
                  ? "bg-espresso text-oat border-espresso/50 rounded-br-md"
                  : "bg-white/80 text-espresso border-black/5 rounded-bl-md"
              }`}
            >
              {!isUser && (
                <div className="mb-2 flex items-center gap-2 text-[11px] text-muted">
                  <span className="material-symbols-outlined text-sm text-sage">smart_toy</span>
                  Mora
                </div>
              )}
              <div className={`whitespace-pre-wrap text-[13px] leading-relaxed ${isUser ? "text-oat" : "text-espresso"}`}>
                {text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
