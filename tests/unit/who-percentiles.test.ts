import { describe, expect, it } from "vitest";
import {
  ageInMonths,
  getWHOPercentiles,
  interpolatePercentileSet,
} from "@/lib/who-percentiles";

describe("who-percentiles", () => {
  it("returns the expected WHO table for metric and gender", () => {
    const maleWeight = getWHOPercentiles("weight", "male");
    const femaleLength = getWHOPercentiles("length", "female");

    expect(maleWeight[0].p50).toBe(3.3);
    expect(maleWeight[24].p97).toBe(14.9);
    expect(femaleLength[0].p3).toBe(45.6);
    expect(femaleLength[12].p50).toBe(74);
  });

  it("computes fractional age in months", () => {
    expect(ageInMonths("2026-01-01", "2026-03-16")).toBeCloseTo(2.5, 1);
    expect(ageInMonths("2026-03-10", "2026-03-07")).toBe(0);
  });

  it("interpolates percentile sets between months and clamps at the ends", () => {
    const rows = getWHOPercentiles("weight", "male");

    expect(interpolatePercentileSet(rows, 2.5)).toEqual({
      p3: 4.7,
      p15: 5.3,
      p50: 6,
      p85: 6.8,
      p97: 7.5,
    });
    expect(interpolatePercentileSet(rows, -1)).toEqual(rows[0]);
    expect(interpolatePercentileSet(rows, 99)).toEqual(rows[24]);
  });
});

