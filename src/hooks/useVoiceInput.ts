"use client";

import { useState, useRef, useCallback } from "react";

export type VoiceState = "idle" | "recording" | "transcribing" | "error";

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        if (chunks.current.length === 0) {
          setState("idle");
          return;
        }

        setState("transcribing");

        const blob = new Blob(chunks.current, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : "mp4";
        const file = new File([blob], `voice.${ext}`, { type: mimeType });

        const formData = new FormData();
        formData.append("audio", file);

        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await res.json();

          if (data.error) {
            setError(data.error);
            setState("error");
          } else if (data.text) {
            onTranscript(data.text);
            setState("idle");
          } else {
            setState("idle");
          }
        } catch (err: any) {
          setError(err.message ?? "Transcription failed");
          setState("error");
        }
      };

      mediaRecorder.current = recorder;
      recorder.start();
      setState("recording");
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied");
      } else {
        setError(err.message ?? "Could not start recording");
      }
      setState("error");
    }
  }, [onTranscript]);

  const stop = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorder.current.stop();
    }
    chunks.current = [];
    setState("idle");
    setError(null);
  }, []);

  const isSupported =
    typeof window !== "undefined" &&
    "mediaDevices" in navigator &&
    "MediaRecorder" in window;

  return { state, error, start, stop, cancel, isSupported };
}
