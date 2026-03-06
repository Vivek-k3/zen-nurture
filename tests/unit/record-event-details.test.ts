import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRecordDetailRows,
  buildRecordPayloadForSave,
  createRecordEditState,
  getRecordEventDetail,
  groupTimelineEventsByDate,
} from "@/lib/record-event-details";

describe("record event detail helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T10:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates edit state with sensible defaults", () => {
    const state = createRecordEditState({
      _id: "event-1",
      type: "FEED_BOTTLE",
      timestamp: "2026-03-07T10:30:00.000Z",
      payload: { amountMl: 120, contentType: "formula", formulaName: "Nan Pro" },
    });

    expect(state.amountMl).toBe(120);
    expect(state.contentType).toBe("formula");
    expect(state.formulaName).toBe("Nan Pro");
  });

  it("builds canonical payloads for save", () => {
    expect(
      buildRecordPayloadForSave("GROWTH", {
        weightKg: "6.4",
        heightCm: "",
        headCm: 40.3,
      })
    ).toEqual({
      weightKg: 6.4,
      heightCm: undefined,
      headCm: 40.3,
    });

    expect(
      buildRecordPayloadForSave("FEED_BOTTLE", {
        amountMl: 120,
        contentType: "breast_milk",
        formulaName: "Ignored",
      })
    ).toEqual({
      amountMl: 120,
      contentType: "breast_milk",
      formulaName: undefined,
    });
  });

  it("renders detail rows and summary strings", () => {
    expect(
      buildRecordDetailRows("GROWTH", { weightKg: 6.3, heightCm: 61.2, headCm: undefined })
    ).toEqual([
      { label: "Weight", value: "6.3 kg" },
      { label: "Height", value: "61.2 cm" },
    ]);

    expect(
      getRecordEventDetail("DIAPER", {
        kind: "mixed",
        texture: "mushy",
        color: "yellow",
        blowout: true,
      })
    ).toBe("mixed · mushy · yellow · blowout");
  });

  it("groups timeline events by relative date labels", () => {
    const groups = groupTimelineEventsByDate([
      { _id: "1", type: "growth", timestamp: "2026-03-07T10:00:00.000Z" },
      { _id: "2", type: "NOTE", timestamp: "2026-03-06T10:00:00.000Z" },
      { _id: "3", type: "DIAPER", timestamp: "2026-03-04T10:00:00.000Z" },
    ]);

    expect(groups[0].label).toBe("Today");
    expect(groups[0].events[0].type).toBe("GROWTH");
    expect(groups[1].label).toBe("Yesterday");
    expect(groups[2].label).toBeTypeOf("string");
  });
});
