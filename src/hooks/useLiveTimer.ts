import { useState, useEffect } from "react";

export function useLiveTimer(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);

  return now;
}

export function formatElapsed(fromMs: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - fromMs);
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}

export function formatElapsedCompact(fromMs: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - fromMs);
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
