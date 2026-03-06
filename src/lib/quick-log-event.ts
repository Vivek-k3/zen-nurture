export type QuickLogView =
  | "menu"
  | "feed"
  | "pump"
  | "diaper"
  | "sleep"
  | "meds"
  | "note"
  | "growth";

export type QuickLogFeedSubType = "bottle" | "breast" | "pump";
export type QuickLogBreastSide = "left" | "right" | "both";
export type QuickLogBottleContentType = "formula" | "breast_milk" | "cow_milk";

export type QuickLogSubmissionInput = {
  view: QuickLogView;
  feedSubType: QuickLogFeedSubType;
  eventTimestamp: Date;
  sleepStart: Date;
  sleepEnd: Date;
  isSleepingNow: boolean;
  bottleContentType: QuickLogBottleContentType;
  formulaName: string;
  volume: number;
  duration: number;
  breastSide: QuickLogBreastSide;
  diaperKind: string;
  diaperTexture?: string;
  diaperColor?: string;
  hasBlowout: boolean;
  hasRash: boolean;
  medName: string;
  medDoseValue: number;
  medDoseUnit: string;
  medOutcome: "taken" | "skipped" | "vomited";
  noteText: string;
  weight: number;
  height: number;
  headCm: number;
};

export type QuickLogSubmission =
  | {
      eventType: "FEED_BOTTLE";
      timestamp: string;
      payload: {
        amountMl: number;
        contentType: QuickLogBottleContentType;
        formulaName?: string;
      };
      upsertFormulaName?: string;
    }
  | {
      eventType: "FEED_BREAST";
      timestamp: string;
      payload: { side: QuickLogBreastSide; durationMin: number };
    }
  | {
      eventType: "PUMP";
      timestamp: string;
      payload: { amountMl: number };
    }
  | {
      eventType: "DIAPER";
      timestamp: string;
      payload: {
        kind: string;
        texture?: string;
        color?: string;
        blowout: boolean;
        rash: boolean;
      };
    }
  | {
      eventType: "SLEEP";
      timestamp: string;
      payload: {
        startTs: string;
        endTs: string | null;
        kind: "nap";
      };
    }
  | {
      eventType: "MED_DOSE";
      timestamp: string;
      payload: {
        medicineName: string;
        doseValue: number;
        doseUnit: string;
        outcome: "taken" | "skipped" | "vomited";
      };
    }
  | {
      eventType: "NOTE";
      timestamp: string;
      payload: { text: string };
    }
  | {
      eventType: "GROWTH";
      timestamp: string;
      payload: {
        weightKg?: number;
        heightCm?: number;
        headCm?: number;
      };
    };

export function buildFormulaDisplayName(company: string, type: string, name: string) {
  return [company.trim(), type.trim(), name.trim()].filter(Boolean).join(" - ");
}

export function buildQuickLogSubmission(input: QuickLogSubmissionInput): QuickLogSubmission | null {
  const loggedAt = input.eventTimestamp.toISOString();

  switch (input.view) {
    case "feed":
    case "pump":
      if (input.feedSubType === "bottle") {
        const formulaName = input.bottleContentType === "formula"
          ? input.formulaName.trim() || undefined
          : undefined;
        return {
          eventType: "FEED_BOTTLE",
          timestamp: loggedAt,
          payload: {
            amountMl: input.volume,
            contentType: input.bottleContentType,
            ...(formulaName ? { formulaName } : {}),
          },
          ...(formulaName ? { upsertFormulaName: formulaName } : {}),
        };
      }

      if (input.feedSubType === "breast") {
        return {
          eventType: "FEED_BREAST",
          timestamp: loggedAt,
          payload: {
            side: input.breastSide,
            durationMin: input.duration,
          },
        };
      }

      return {
        eventType: "PUMP",
        timestamp: loggedAt,
        payload: {
          amountMl: input.volume,
        },
      };
    case "diaper":
      return {
        eventType: "DIAPER",
        timestamp: loggedAt,
        payload: {
          kind: input.diaperKind,
          texture: input.diaperTexture,
          color: input.diaperColor,
          blowout: input.hasBlowout,
          rash: input.hasRash,
        },
      };
    case "sleep":
      return {
        eventType: "SLEEP",
        timestamp: (input.isSleepingNow ? input.sleepStart : input.sleepEnd).toISOString(),
        payload: {
          startTs: input.sleepStart.toISOString(),
          endTs: input.isSleepingNow ? null : input.sleepEnd.toISOString(),
          kind: "nap",
        },
      };
    case "meds": {
      const medicineName = input.medName.trim();
      if (!medicineName) return null;
      return {
        eventType: "MED_DOSE",
        timestamp: loggedAt,
        payload: {
          medicineName,
          doseValue: input.medDoseValue,
          doseUnit: input.medDoseUnit,
          outcome: input.medOutcome,
        },
      };
    }
    case "note":
      return {
        eventType: "NOTE",
        timestamp: loggedAt,
        payload: {
          text: input.noteText,
        },
      };
    case "growth":
      return {
        eventType: "GROWTH",
        timestamp: loggedAt,
        payload: {
          weightKg: input.weight || undefined,
          heightCm: input.height || undefined,
          headCm: input.headCm || undefined,
        },
      };
    default:
      return null;
  }
}
