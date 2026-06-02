import { describe, it, expect, vi, afterEach } from "vitest";
import { formatDuration, formatBabyAge } from "./time";

describe("formatDuration", () => {
  it("formats minutes under an hour", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(45)).toBe("45m");
  });

  it("formats whole hours without minutes", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(135)).toBe("2h 15m");
  });
});

describe("formatBabyAge", () => {
  afterEach(() => vi.useRealTimers());

  function freeze(iso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  }

  it("says born today on the day of birth", () => {
    freeze("2026-06-02T18:00:00Z");
    expect(formatBabyAge("2026-06-02T06:00:00Z")).toBe("Born today!");
  });

  it("counts days for a newborn", () => {
    freeze("2026-06-10T12:00:00Z");
    expect(formatBabyAge("2026-06-05T12:00:00Z")).toBe("5 days old");
  });

  it("reports months for an infant", () => {
    freeze("2026-06-02T12:00:00Z");
    expect(formatBabyAge("2026-03-10T12:00:00Z")).toMatch(/^2mo/);
  });

  it("reports years for a toddler", () => {
    freeze("2026-06-02T12:00:00Z");
    expect(formatBabyAge("2024-01-01T12:00:00Z")).toBe("2 years old");
  });
});
