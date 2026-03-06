import { normalizeEventType } from "@/lib/constants";
import { formatDate, isToday, isYesterday } from "@/lib/time";

type TimelineEvent = {
  _id: string;
  timestamp: string;
  type: string;
  payload?: unknown;
};

type DetailRow = {
  label: string;
  value: string;
};

export function createRecordEditState(event: TimelineEvent) {
  const payload = (event.payload ?? {}) as Record<string, any>;

  return {
    timestamp: new Date(event.timestamp),
    amountMl: payload.amountMl ?? "",
    contentType: payload.contentType ?? "formula",
    formulaName: payload.formulaName ?? "",
    durationMin: payload.durationMin ?? "",
    side: payload.side ?? "left",
    kind: payload.kind ?? "wet",
    texture: payload.texture ?? "mushy",
    color: payload.color ?? "yellow",
    blowout: Boolean(payload.blowout),
    rash: Boolean(payload.rash),
    startTs: new Date(payload.startTs ?? event.timestamp),
    endTs: new Date(payload.endTs ?? event.timestamp),
    medicineName: payload.medicineName ?? "",
    doseValue: payload.doseValue ?? "",
    doseUnit: payload.doseUnit ?? "ml",
    outcome: payload.outcome ?? "taken",
    text: payload.text ?? "",
    weightKg: payload.weightKg ?? "",
    heightCm: payload.heightCm ?? "",
    headCm: payload.headCm ?? "",
  };
}

export function buildRecordPayloadForSave(type: string, form: any) {
  switch (type) {
    case "FEED_BOTTLE":
      return {
        amountMl: asNumber(form.amountMl),
        contentType: form.contentType,
        formulaName: form.contentType === "formula" ? form.formulaName || undefined : undefined,
      };
    case "FEED_BREAST":
      return {
        durationMin: asNumber(form.durationMin),
        side: form.side,
      };
    case "DIAPER":
      return {
        kind: form.kind,
        texture: form.texture,
        color: form.color,
        blowout: form.blowout,
        rash: form.rash,
      };
    case "SLEEP":
      return {
        startTs: form.startTs.toISOString(),
        endTs: form.endTs.toISOString(),
      };
    case "MED_DOSE":
      return {
        medicineName: form.medicineName,
        doseValue: asNumber(form.doseValue),
        doseUnit: form.doseUnit,
        outcome: form.outcome,
      };
    case "NOTE":
      return {
        text: form.text,
      };
    case "GROWTH":
      return {
        weightKg: asNumber(form.weightKg),
        heightCm: asNumber(form.heightCm),
        headCm: asNumber(form.headCm),
      };
    default:
      return form;
  }
}

export function buildRecordDetailRows(type: string, payload: Record<string, any>) {
  switch (type) {
    case "FEED_BOTTLE":
      return compactRows([
        ["Amount", payload.amountMl ? `${payload.amountMl} ml` : null],
        ["Content", payload.contentType ? payload.contentType.replace("_", " ") : null],
        ["Formula", payload.formulaName ?? null],
      ]);
    case "FEED_BREAST":
      return compactRows([
        ["Duration", payload.durationMin ? `${payload.durationMin} min` : null],
        ["Side", payload.side ?? null],
      ]);
    case "DIAPER":
      return compactRows([
        ["Kind", payload.kind ?? null],
        ["Texture", payload.texture ?? null],
        ["Color", payload.color ?? null],
        ["Blowout", payload.blowout ? "Yes" : null],
        ["Rash", payload.rash ? "Yes" : null],
      ]);
    case "SLEEP":
      return compactRows([
        ["Start", payload.startTs ? new Date(payload.startTs).toLocaleString("en-IN") : null],
        ["End", payload.endTs ? new Date(payload.endTs).toLocaleString("en-IN") : "In progress"],
      ]);
    case "MED_DOSE":
      return compactRows([
        ["Medicine", payload.medicineName ?? null],
        ["Dose", payload.doseValue ? `${payload.doseValue} ${payload.doseUnit ?? ""}` : null],
        ["Outcome", payload.outcome ?? null],
      ]);
    case "NOTE":
      return compactRows([["Note", payload.text ?? null]]);
    case "GROWTH":
      return compactRows([
        ["Weight", payload.weightKg ? `${payload.weightKg} kg` : null],
        ["Height", payload.heightCm ? `${payload.heightCm} cm` : null],
        ["Head", payload.headCm ? `${payload.headCm} cm` : null],
      ]);
    default:
      return [];
  }
}

export function getRecordEventDetail(type: string, payload: Record<string, any>): string | null {
  switch (type) {
    case "FEED_BOTTLE": {
      const parts = [];
      if (payload.amountMl) parts.push(`${payload.amountMl}ml`);
      if (payload.formulaName) parts.push(payload.formulaName);
      else if (payload.contentType === "breast_milk") parts.push("Breast Milk");
      else if (payload.contentType === "cow_milk") parts.push("Cow Milk");
      return parts.join(" · ") || null;
    }
    case "FEED_BREAST": {
      const parts = [];
      if (payload.durationMin) parts.push(`${payload.durationMin}min`);
      if (payload.side) parts.push(payload.side);
      return parts.join(" · ") || null;
    }
    case "PUMP":
      return payload.amountMl ? `${payload.amountMl}ml` : null;
    case "DIAPER": {
      const parts = [];
      if (payload.kind) parts.push(payload.kind);
      if (payload.texture) parts.push(payload.texture);
      if (payload.color) parts.push(payload.color);
      if (payload.blowout) parts.push("blowout");
      if (payload.rash) parts.push("rash");
      return parts.join(" · ") || null;
    }
    case "SLEEP":
      return payload.endTs ? "Completed" : "In progress";
    case "MED_DOSE": {
      const parts = [];
      if (payload.medicineName) parts.push(payload.medicineName);
      if (payload.doseValue) parts.push(`${payload.doseValue} ${payload.doseUnit ?? ""}`);
      if (payload.outcome) parts.push(payload.outcome);
      return parts.join(" · ") || null;
    }
    case "NOTE":
      return payload.text ? payload.text.slice(0, 80) : null;
    case "GROWTH": {
      const parts = [];
      if (payload.weightKg) parts.push(`${payload.weightKg}kg`);
      if (payload.heightCm) parts.push(`${payload.heightCm}cm`);
      if (payload.headCm) parts.push(`head ${payload.headCm}cm`);
      return parts.join(" · ") || null;
    }
    default:
      return null;
  }
}

export function groupTimelineEventsByDate(events: TimelineEvent[]) {
  const groups: { label: string; events: TimelineEvent[] }[] = [];
  let currentLabel = "";

  for (const event of events) {
    const label = isToday(event.timestamp)
      ? "Today"
      : isYesterday(event.timestamp)
      ? "Yesterday"
      : formatDate(event.timestamp);

    if (label !== currentLabel) {
      groups.push({ label, events: [] });
      currentLabel = label;
    }

    groups[groups.length - 1].events.push({
      ...event,
      type: normalizeEventType(event.type),
    });
  }

  return groups;
}

function compactRows(entries: Array<[string, string | null]>): DetailRow[] {
  return entries
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: value as string }));
}

function asNumber(value: number | "" | undefined) {
  return value === "" || value == null || Number.isNaN(Number(value)) ? undefined : Number(value);
}
