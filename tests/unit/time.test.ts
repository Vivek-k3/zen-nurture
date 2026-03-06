import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatBabyAge,
  formatDuration,
  formatTimeAgoShort,
  formatTimeSince,
  getDateDaysAgo,
  getEndOfDay,
  getRelativeTimeString,
  getStartOfDay,
  isToday,
  isYesterday,
} from "@/lib/time";

describe("time helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T10:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats recent relative times", () => {
    expect(formatTimeSince("2026-03-07T10:29:45.000Z")).toBe("Just now");
    expect(formatTimeSince("2026-03-07T10:12:00.000Z")).toBe("18m ago");
    expect(formatTimeSince("2026-03-07T07:00:00.000Z")).toBe("3h 30m ago");
    expect(formatTimeSince("2026-03-06T07:00:00.000Z")).toBe("Yesterday");
  });

  it("formats short relative times", () => {
    expect(formatTimeAgoShort("2026-03-07T10:12:00.000Z")).toBe("18m");
    expect(formatTimeAgoShort("2026-03-07T08:00:00.000Z")).toBe("2h 30m");
    expect(formatTimeAgoShort("2026-03-05T10:30:00.000Z")).toBe("2d");
  });

  it("formats durations and day boundaries", () => {
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(135)).toBe("2h 15m");

    expect(getStartOfDay(new Date("2026-03-07T10:30:00.000Z")).toISOString()).toBe("2026-03-06T18:30:00.000Z");
    expect(getEndOfDay(new Date("2026-03-07T10:30:00.000Z")).toISOString()).toBe("2026-03-07T18:29:59.999Z");
    expect(getDateDaysAgo(3).toISOString()).toBe("2026-03-03T18:30:00.000Z");
  });

  it("detects today, yesterday, and relative labels", () => {
    expect(isToday("2026-03-07T04:00:00.000Z")).toBe(true);
    expect(isYesterday("2026-03-06T04:00:00.000Z")).toBe(true);
    expect(getRelativeTimeString("2026-03-07T04:00:00.000Z")).toBe("Today");
    expect(getRelativeTimeString("2026-03-06T04:00:00.000Z")).toBe("Yesterday");
  });

  it("formats baby age across days, months, years, and future dates", () => {
    expect(formatBabyAge("2026-03-07T00:00:00.000Z")).toBe("Born today!");
    expect(formatBabyAge("2026-03-01T00:00:00.000Z")).toBe("6 days old");
    expect(formatBabyAge("2026-01-15T00:00:00.000Z")).toBe("1mo, 20d old");
    expect(formatBabyAge("2025-02-07T00:00:00.000Z")).toBe("1 year, 1mo old");
    expect(formatBabyAge("2023-03-07T00:00:00.000Z")).toBe("3 years old");
    expect(formatBabyAge("2026-03-10T00:00:00.000Z")).toBe("Due in 3d");
  });
});
