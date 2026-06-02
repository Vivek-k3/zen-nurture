"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { useAction, useQuery } from "convex/react";
import { useUIMessages, useSmoothText } from "@convex-dev/agent/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ShimmeringText } from "@/components/shimmering-text/shimmering-text";
import MoraOrb from "@/components/MoraOrb";
import MoraApprovalCard from "@/components/MoraApprovalCard";
import VoiceButton from "./VoiceButton";

export type MoraClientContext = {
  pathname?: string;
  pageLabel?: string;
  userName?: string;
  userEmail?: string;
  familyName?: string;
  babyName?: string;
  babyDob?: string;
  babyTimezone?: string;
};

interface MoraThreadProps {
  threadId: string;
  quickPrompts: string[];
  clientContext: MoraClientContext;
}

export default function MoraThread({ threadId, quickPrompts, clientContext }: MoraThreadProps) {
  const { results: messages } = useUIMessages(
    api.moraChat.listThreadMessages,
    { threadId },
    { initialNumItems: 30, stream: true }
  );
  const pending = useQuery(api.mora.listPendingMoraActions, { threadId }) ?? [];
  const streamChat = useAction(api.moraChat.streamChat);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const send = useCallback(
    async (text: string) => {
      const prompt = text.trim();
      if (!prompt || sending) return;
      setInput("");
      setSending(true);
      try {
        await streamChat({ threadId, prompt, clientContext });
      } catch (err) {
        console.error("[mora] streamChat failed", err);
      } finally {
        setSending(false);
      }
    },
    [streamChat, threadId, clientContext, sending]
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending, sending]);

  const isEmpty = (messages?.length ?? 0) === 0;
  const lastIsAssistant = messages?.[messages.length - 1]?.role === "assistant";

  return (
    <>
      <div ref={viewportRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <MoraWelcome quickPrompts={quickPrompts} onPick={send} />
        ) : (
          <div className="py-2">
            {messages.map((m) => (
              <MoraMessage key={m.key} role={m.role} text={m.text} parts={m.parts} streaming={m.status === "streaming"} />
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <div className="px-4 py-2 space-y-2">
            {pending.map((action: { _id: string }) => (
              <MoraApprovalCard key={action._id} action={action} />
            ))}
          </div>
        )}

        {sending && !lastIsAssistant && (
          <div className="px-4 py-1.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <MoraOrb size="xs" state="thinking" />
              <span>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      <MoraComposer
        input={input}
        setInput={setInput}
        onSend={() => send(input)}
        onVoice={send}
        disabled={sending}
      />
    </>
  );
}

/* ---------- Welcome / Empty ---------- */

function MoraWelcome({ quickPrompts, onPick }: { quickPrompts: string[]; onPick: (p: string) => void }) {
  return (
    <div className="p-5 space-y-4">
      <div className="rounded-2xl border border-sage/15 bg-white/70 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <MoraOrb size="xs" state="idle" />
          <span className="text-[13px] font-semibold text-espresso">Mora</span>
        </div>
        <p className="text-[13px] text-muted leading-relaxed">
          Ask about feeds, sleep, diapers, reminders, or trends. I&rsquo;ll ask for
          approval before changes unless YOLO mode is on.
        </p>
        <p className="text-[11px] mt-1.5">
          <ShimmeringText
            text="Ready when you are"
            duration={2}
            className="[--color:var(--sage)] [--shimmering-color:var(--espresso)]"
          />
        </p>
      </div>

      <div className="flex flex-wrap gap-2" data-tour-step-id="mora-prompts">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-white/70 bg-white/70 text-espresso hover:bg-white transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Message ---------- */

type MessagePart = { type?: string };

function MoraMessage({
  role,
  text,
  parts,
  streaming,
}: {
  role: string;
  text: string;
  parts?: MessagePart[];
  streaming: boolean;
}) {
  const isUser = role === "user";
  const [visibleText] = useSmoothText(text ?? "", { startStreaming: streaming });
  const shown = isUser ? text ?? "" : visibleText;

  const toolNames = (parts ?? [])
    .map((p) => (typeof p.type === "string" && p.type.startsWith("tool-") ? p.type.slice(5) : null))
    .filter((n): n is string => !!n);

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1.5">
        <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 bg-espresso text-oat shadow-sm">
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{shown}</p>
        </div>
      </div>
    );
  }

  // Skip empty assistant frames (e.g. tool-only steps with no text yet).
  if (!shown && toolNames.length === 0) return null;

  return (
    <div className="flex justify-start px-4 py-1.5">
      <div className="max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3 bg-white/80 border border-black/5 shadow-sm">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted">
          <MoraOrb size="xs" state={streaming ? "thinking" : "idle"} />
          Mora
        </div>

        {toolNames.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {toolNames.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="inline-flex items-center gap-1 rounded-full border border-sage/20 bg-sage/5 px-2 py-0.5 text-[10px] text-sage"
              >
                <span className="material-symbols-outlined text-[12px]">build</span>
                {name.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {shown && (
          <div className="text-[13px] leading-relaxed text-espresso whitespace-pre-wrap">{shown}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Composer ---------- */

function MoraComposer({
  input,
  setInput,
  onSend,
  onVoice,
  disabled,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onVoice: (text: string) => void;
  disabled: boolean;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-black/5 bg-white/70 backdrop-blur-sm p-3" data-tour-step-id="mora-composer">
      <div className="flex items-end gap-2">
        <VoiceButton onTranscript={onVoice} />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Mora or tap mic..."
          rows={1}
          autoFocus
          className="flex-1 resize-none rounded-2xl bg-[#fffefb] border border-muted/10 px-4 py-2.5 text-[13px] text-espresso leading-relaxed placeholder:text-muted/50 focus:outline-none focus:border-sage/30 max-h-32"
        />
        <Button
          size="icon"
          onClick={onSend}
          disabled={disabled || !input.trim()}
          className="h-10 w-10 rounded-xl shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </Button>
      </div>
      <p className="text-[10px] text-muted mt-1.5 px-1">
        Tap mic to speak or type. Mora reads live data and proposes changes.
      </p>
    </div>
  );
}
