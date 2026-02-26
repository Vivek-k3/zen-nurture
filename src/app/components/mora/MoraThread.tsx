"use client";

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessage,
} from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import MoraOrb from "@/components/MoraOrb";

interface MoraThreadProps {
  quickPrompts: string[];
}

export default function MoraThread({ quickPrompts }: MoraThreadProps) {
  return (
    <>
      <ThreadPrimitive.Viewport
        autoScroll
        className="flex-1 overflow-y-auto"
      >
        <MoraWelcome quickPrompts={quickPrompts} />
        <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
      </ThreadPrimitive.Viewport>

      <MoraComposer />
    </>
  );
}

/* ---------- Welcome / Empty ---------- */

function MoraWelcome({ quickPrompts }: { quickPrompts: string[] }) {
  return (
    <ThreadPrimitive.Empty>
      <div className="p-5 space-y-4">
        <div className="rounded-2xl border border-sage/15 bg-white/70 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MoraOrb size="xs" state="idle" />
            <span className="text-[13px] font-semibold text-espresso">Mora</span>
          </div>
          <p className="text-[13px] text-muted leading-relaxed">
            Ask about feeds, sleep, diapers, reminders, or trends. I&rsquo;ll
            ask for approval before changes unless YOLO mode is on.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <ThreadPrimitive.Suggestion key={prompt} prompt={prompt} autoSend asChild>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-white/70 bg-white/70 text-espresso hover:bg-white transition-colors"
              >
                {prompt}
              </button>
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
}

/* ---------- User Message ---------- */

function UserMessage() {
  return (
    <div className="flex justify-end px-4 py-1.5">
      <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 bg-espresso text-oat shadow-sm">
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => (
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{text}</p>
            ),
          }}
        />
      </div>
    </div>
  );
}

/* ---------- Assistant Message ---------- */

function AssistantMessage() {
  return (
    <div className="flex justify-start px-4 py-1.5">
      <div className="max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3 bg-white/80 border border-black/5 shadow-sm">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted">
          <MoraOrb size="xs" state="idle" />
          Mora
        </div>
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => (
              <div className="text-[13px] leading-relaxed text-espresso whitespace-pre-wrap">
                {text}
              </div>
            ),
          }}
        />
        <MessagePrimitive.If lastOrHover>
          <InProgressIndicator />
        </MessagePrimitive.If>
      </div>
    </div>
  );
}

/* ---------- In-Progress Indicator ---------- */

function InProgressIndicator() {
  const message = useMessage();
  if (message.status?.type !== "running") return null;

  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
      <MoraOrb size="xs" state="thinking" />
      <span>Thinking...</span>
    </div>
  );
}

/* ---------- Composer ---------- */

function MoraComposer() {
  return (
    <div className="border-t border-black/5 bg-white/70 backdrop-blur-sm p-3">
      <ComposerPrimitive.Root className="flex items-end gap-2">
        <ComposerPrimitive.Input
          placeholder="Ask Mora..."
          rows={1}
          autoFocus
          className="flex-1 resize-none rounded-2xl bg-[#fffefb] border border-muted/10 px-4 py-2.5 text-[13px] text-espresso leading-relaxed placeholder:text-muted/50 focus:outline-none focus:border-sage/30 max-h-32"
        />
        <ComposerPrimitive.Send asChild>
          <Button size="icon" className="h-10 w-10 rounded-xl shrink-0">
            <span className="material-symbols-outlined text-[20px]">send</span>
          </Button>
        </ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
      <p className="text-[10px] text-muted mt-1.5 px-1">
        Mora reads live + historic data and proposes approved changes.
      </p>
    </div>
  );
}
