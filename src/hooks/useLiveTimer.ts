import { useState, useEffect } from "react";

/**
 * Provides a live timestamp that updates at a configurable interval.
 *
 * @param interval - Update cadence in milliseconds (default: 60000). When changed, the hook reschedules updates.
 * @returns The current time as milliseconds since the UNIX epoch
 */
export function useLiveTimer(interval = 60_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);

  return now;
}

/**
 * Formats the elapsed time between two millisecond timestamps into a concise human-readable string.
 *
 * @param fromMs - Start timestamp in milliseconds since the Unix epoch
 * @param nowMs - End timestamp in milliseconds since the Unix epoch
 * @returns `"<1m"` if less than one minute has elapsed, `"Xm"` when minutes are present, or `"Xh Ym"` when one or more hours have elapsed (minutes are zero-padded to two digits)
 */
export function formatElapsed(fromMs: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - fromMs);
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);

  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m`;
  return "<1m";
}

/**
 * Format the elapsed time between two timestamps as a zero-padded "HH:MM" string.
 *
 * @param fromMs - Start time in milliseconds since the Unix epoch
 * @param nowMs - End time in milliseconds since the Unix epoch
 * @returns An "HH:MM" string representing the duration from `fromMs` to `nowMs`, with hours and minutes zero-padded
 */
export function formatElapsedCompact(fromMs: number, nowMs: number): string {
  const diff = Math.max(0, nowMs - fromMs);
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);

  return `${pad(h)}:${pad(m)}`;
}

/**
 * Format a number as a two-digit string by adding a leading zero if necessary.
 *
 * @param n - The number to format
 * @returns The input formatted as a two-digit string (e.g., `"04"`, `"12"`)
 */
function pad(n: number) {
  return n.toString().padStart(2, "0");
}
