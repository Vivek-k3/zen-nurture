"use client";

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessage,
  useComposerRuntime,
} from "@assistant-ui/react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ShimmeringText } from "@/components/shimmering-text/shimmering-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import MoraOrb from "@/components/MoraOrb";
import VoiceButton from "./VoiceButton";
import MoraFirstLook from "./MoraFirstLook";

interface MoraThreadProps {
  quickPrompts: string[];
  pageLabel: string;
  activeBabyId?: string | null;
}

export default function MoraThread({ quickPrompts, pageLabel, activeBabyId }: MoraThreadProps) {
  return (
    <>
      <ThreadPrimitive.Viewport
        autoScroll
        className="flex-1 overflow-y-auto"
      >
        <MoraWelcome
          quickPrompts={quickPrompts}
          pageLabel={pageLabel}
          activeBabyId={activeBabyId}
        />
        <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
      </ThreadPrimitive.Viewport>

      <MoraComposer />
    </>
  );
}

/* ---------- Welcome / Empty ---------- */

function MoraWelcome({
  quickPrompts,
  pageLabel,
  activeBabyId,
}: {
  quickPrompts: string[];
  pageLabel: string;
  activeBabyId?: string | null;
}) {
  return (
    <ThreadPrimitive.Empty>
      <div className="p-4 space-y-3">
        {pageLabel === "Today" ? (
          <MoraFirstLook pageLabel={pageLabel} babyId={activeBabyId} />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MoraOrb size="xs" state="idle" />
              <span className="text-[13px] font-medium text-espresso">Mora</span>
            </div>
            <p className="text-[13px] text-muted leading-relaxed">
              Ask about feeds, sleep, diapers, reminders, or trends. I&rsquo;ll
              ask for approval before changes unless YOLO mode is on.
            </p>
            <p className="text-[11px] text-muted">
              <ShimmeringText text="Ready when you are" duration={2} className="[--color:var(--sage)] [--shimmering-color:var(--espresso)]" />
            </p>
          </>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1" data-tour-step-id="mora-prompts">
          {quickPrompts.map((prompt) => (
            <ThreadPrimitive.Suggestion key={prompt} prompt={prompt} autoSend asChild>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md text-[11px] text-muted hover:text-espresso hover:bg-black/5 transition-colors"
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
  const { data: session } = authClient.useSession();
  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="flex justify-end items-start gap-2 px-4 py-1">
      <MessagePrimitive.Content
        components={{
          Text: ({ text }) => (
            <p className="text-[13px] leading-relaxed text-espresso whitespace-pre-wrap max-w-[85%] text-right">{text}</p>
          ),
        }}
      />
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? "You"} />
        <AvatarFallback className="bg-espresso/10 text-espresso text-[10px] font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

/* ---------- Assistant Message ---------- */

function AssistantMessage() {
  return (
    <div className="flex justify-start px-4 py-1">
      <div className="max-w-[92%]">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted">
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
      <ShimmeringText text="Thinking..." duration={1.5} className="[--color:var(--sage)] [--shimmering-color:var(--espresso)]" />
    </div>
  );
}

/* ---------- Composer ---------- */

function MoraComposer() {
  const composerRuntime = useComposerRuntime();

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      const currentText = composerRuntime.getState().text.trim();
      const nextText = currentText ? `${currentText} ${text}` : text;
      composerRuntime.setText(nextText);
    },
    [composerRuntime]
  );

  return (
    <div
      className="border-t border-black/5 p-3"
      data-tour-step-id="mora-composer"
    >
      <ComposerPrimitive.Root className="flex items-end gap-2">
        <VoiceButton onTranscript={handleVoiceTranscript} />
        <ComposerPrimitive.Input
          placeholder="Ask Mora or tap mic..."
          rows={1}
          className="flex-1 resize-none rounded-lg bg-black/5 border-0 px-3 py-2 text-[13px] text-espresso leading-relaxed placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-black/10 max-h-32"
        />
        <ComposerPrimitive.Send asChild>
          <Button size="icon" className="h-9 w-9 rounded-lg shrink-0">
            <span className="material-symbols-outlined text-[18px]">send</span>
          </Button>
        </ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
      <p className="text-[10px] text-muted mt-1 px-1">
        Mora reads live data and proposes changes.
      </p>
    </div>
  );
}
