"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MoraComposerProps {
  disabled?: boolean;
  busy?: boolean;
  onSend: (text: string) => Promise<void> | void;
}

export default function MoraComposer({ disabled, busy, onSend }: MoraComposerProps) {
  const [value, setValue] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled || busy) return;
    setValue("");
    await onSend(text);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-black/5 bg-white/70 backdrop-blur-sm p-4 space-y-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={disabled ? "Mora is disabled in Settings" : "Ask Mora about feeds, sleep, reminders, or trends..."}
        disabled={disabled || busy}
        rows={3}
        className="min-h-[84px] resize-none rounded-2xl bg-[#fffefb] text-[13px] leading-relaxed"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted">
          {busy ? "Thinking..." : "Mora can read live + historic data and propose approved changes."}
        </p>
        <Button type="submit" size="sm" disabled={disabled || busy || !value.trim()} className="text-[12px]">
          <span className="material-symbols-outlined text-[18px]">send</span>
          Send
        </Button>
      </div>
    </form>
  );
}
