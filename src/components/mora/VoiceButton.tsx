"use client";

import { useVoiceInput, type VoiceState } from "@/hooks/useVoiceInput";
import MoraOrb from "@/components/MoraOrb";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
}

export default function VoiceButton({ onTranscript }: VoiceButtonProps) {
  const { state, error, start, stop, cancel, isSupported } = useVoiceInput(onTranscript);

  if (!isSupported) return null;

  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";
  const isBusy = isRecording || isTranscribing;

  return (
    <div className="flex items-center gap-1.5">
      {/* Main mic button */}
      <button
        type="button"
        onClick={isRecording ? stop : isBusy ? undefined : start}
        disabled={isTranscribing}
        title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Voice input"}
        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
          isRecording
            ? "bg-alert-red text-white animate-pulse shadow-md shadow-alert-red/20"
            : isTranscribing
            ? "bg-sage/10 text-sage"
            : "bg-oat hover:bg-sage/10 text-muted hover:text-sage border border-muted/10"
        }`}
      >
        {isTranscribing ? (
          <MoraOrb size="xs" state="thinking" />
        ) : (
          <span className="material-symbols-outlined text-[20px]">
            {isRecording ? "stop" : "mic"}
          </span>
        )}
      </button>

      {/* Cancel button (visible during recording) */}
      {isRecording && (
        <button
          type="button"
          onClick={cancel}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-alert-red bg-oat/50 border border-muted/10 text-[14px]"
          title="Cancel"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}

      {/* Status text */}
      {isBusy && (
        <span className="text-[11px] text-muted animate-pulse">
          {isRecording ? "Listening..." : "Transcribing..."}
        </span>
      )}

      {/* Error */}
      {state === "error" && error && (
        <span className="text-[11px] text-alert-red truncate max-w-[140px]">{error}</span>
      )}
    </div>
  );
}
