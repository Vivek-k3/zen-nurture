import { describe, expect, it } from "vitest";

import { normalizeEventPayload, normalizeEventType, validateEventPayload } from "./eventPayloads";

describe("normalizeEventType", () => {
  it("normalizes common aliases", () => {
    expect(normalizeEventType("growth")).toBe("GROWTH");
    expect(normalizeEventType("bottle feed")).toBe("FEED_BOTTLE");
    expect(normalizeEventType("meds")).toBe("MED_DOSE");
  });
});

describe("normalizeEventPayload", () => {
  it("canonicalizes growth metric/value/unit payloads", () => {
    const payload = normalizeEventPayload("GROWTH", {
      metric: "weight",
      value: "8.4",
      unit: "kg",
    }) as Record<string, unknown>;

    expect(payload.weightKg).toBe(8.4);
  });

  it("converts growth imperial units to canonical metric fields", () => {
    const payload = normalizeEventPayload("GROWTH", {
      metric: "height",
      value: 22,
      unit: "in",
    }) as Record<string, unknown>;

    expect(payload.heightCm).toBe(55.88);
  });

  it("normalizes bottle feed payloads", () => {
    const payload = normalizeEventPayload("FEED_BOTTLE", {
      amount_ml: "120",
      content_type: "Breast Milk",
      formula_name: "  Nan Pro  ",
    }) as Record<string, unknown>;

    expect(payload.amountMl).toBe(120);
    expect(payload.contentType).toBe("breast_milk");
    expect(payload.formulaName).toBe("Nan Pro");
  });

  it("normalizes diaper aliases and booleans", () => {
    const payload = normalizeEventPayload("DIAPER", {
      type: "poop_and_pee",
      blowout: "yes",
      rash: "false",
    }) as Record<string, unknown>;

    expect(payload.kind).toBe("mixed");
    expect(payload.blowout).toBe(true);
    expect(payload.rash).toBe(false);
  });

  it("normalizes note aliases to text", () => {
    const payload = normalizeEventPayload("NOTE", {
      notes: "  Slept badly after feed  ",
    }) as Record<string, unknown>;

    expect(payload.text).toBe("Slept badly after feed");
  });

  it("preserves open sleep sessions while normalizing timestamps", () => {
    const payload = normalizeEventPayload("SLEEP", {
      startTs: "2026-03-06T03:00:00.000Z",
      endTs: null,
      kind: "Night",
    }) as Record<string, unknown>;

    expect(payload.startTs).toBe("2026-03-06T03:00:00.000Z");
    expect(payload.endTs).toBeNull();
    expect(payload.kind).toBe("night");
  });

  it("rejects empty growth payloads", () => {
    expect(validateEventPayload("GROWTH", {})).toBe(
      "Growth events require at least one measurement: weightKg, heightCm, or headCm."
    );
  });

  it("accepts canonical growth payloads", () => {
    expect(validateEventPayload("GROWTH", { weightKg: 6.2 })).toBeNull();
  });
});
