import { describe, expect, it } from "vitest";
import {
  buildFormulaDisplayName,
  buildQuickLogSubmission,
} from "@/lib/quick-log-event";

const baseInput = {
  view: "feed" as const,
  feedSubType: "bottle" as const,
  eventTimestamp: new Date("2026-03-07T10:30:00.000Z"),
  sleepStart: new Date("2026-03-07T09:00:00.000Z"),
  sleepEnd: new Date("2026-03-07T10:00:00.000Z"),
  isSleepingNow: false,
  bottleContentType: "formula" as const,
  formulaName: "Nan Pro",
  volume: 120,
  duration: 15,
  breastSide: "left" as const,
  diaperKind: "wet",
  diaperTexture: "mushy",
  diaperColor: "yellow",
  hasBlowout: false,
  hasRash: false,
  medName: "Calpol",
  medDoseValue: 2.5,
  medDoseUnit: "ml",
  medOutcome: "taken" as const,
  noteText: "Slept well",
  weight: 6.2,
  height: 61.5,
  headCm: 40.2,
};

describe("quick log event helpers", () => {
  it("builds a clean formula label", () => {
    expect(buildFormulaDisplayName("Nestle", "Stage 1", "Nan Pro")).toBe("Nestle - Stage 1 - Nan Pro");
  });

  it("builds bottle feed submissions with formula upsert intent", () => {
    expect(buildQuickLogSubmission(baseInput)).toEqual({
      eventType: "FEED_BOTTLE",
      timestamp: "2026-03-07T10:30:00.000Z",
      payload: {
        amountMl: 120,
        contentType: "formula",
        formulaName: "Nan Pro",
      },
      upsertFormulaName: "Nan Pro",
    });
  });

  it("builds sleep, growth, and note submissions in canonical shapes", () => {
    expect(
      buildQuickLogSubmission({
        ...baseInput,
        view: "sleep",
        feedSubType: "pump",
        isSleepingNow: true,
      })
    ).toEqual({
      eventType: "SLEEP",
      timestamp: "2026-03-07T09:00:00.000Z",
      payload: {
        startTs: "2026-03-07T09:00:00.000Z",
        endTs: null,
        kind: "nap",
      },
    });

    expect(
      buildQuickLogSubmission({
        ...baseInput,
        view: "growth",
      })
    ).toEqual({
      eventType: "GROWTH",
      timestamp: "2026-03-07T10:30:00.000Z",
      payload: {
        weightKg: 6.2,
        heightCm: 61.5,
        headCm: 40.2,
      },
    });

    expect(
      buildQuickLogSubmission({
        ...baseInput,
        view: "note",
      })
    ).toEqual({
      eventType: "NOTE",
      timestamp: "2026-03-07T10:30:00.000Z",
      payload: {
        text: "Slept well",
      },
    });
  });

  it("blocks medicine submissions without a name", () => {
    expect(
      buildQuickLogSubmission({
        ...baseInput,
        view: "meds",
        medName: "   ",
      })
    ).toBeNull();
  });
});

