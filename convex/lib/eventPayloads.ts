const EVENT_TYPE_ALIASES: Record<string, string> = {
  feed_bottle: "FEED_BOTTLE",
  bottle_feed: "FEED_BOTTLE",
  bottle: "FEED_BOTTLE",
  feed_breast: "FEED_BREAST",
  breast_feed: "FEED_BREAST",
  breastfeeding: "FEED_BREAST",
  breast: "FEED_BREAST",
  pump: "PUMP",
  pumping: "PUMP",
  diaper: "DIAPER",
  nappy: "DIAPER",
  sleep: "SLEEP",
  nap: "SLEEP",
  med_dose: "MED_DOSE",
  medicine: "MED_DOSE",
  medication: "MED_DOSE",
  meds: "MED_DOSE",
  note: "NOTE",
  notes: "NOTE",
  growth: "GROWTH",
  vaccine: "VACCINE_DOSE",
  vaccine_dose: "VACCINE_DOSE",
};

export function normalizeEventType(type?: unknown): string {
  if (typeof type !== "string" || !type.trim()) return "";
  const upper = type.toUpperCase();
  if (upper.includes("_") || upper === type) return upper;
  return EVENT_TYPE_ALIASES[type.trim().toLowerCase().replace(/[\s-]+/g, "_")] ?? upper;
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }
  return undefined;
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeTimestamp(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

function normalizeEnum(value: unknown, allowed: readonly string[], fallback?: string) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (allowed.includes(normalized)) return normalized;
  }
  return fallback;
}

function normalizeGrowthMetric(metric: unknown): "weight" | "length" | "head" | null {
  if (typeof metric !== "string") return null;
  const key = metric.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (["weight", "weight_kg", "mass", "body_weight"].includes(key)) return "weight";
  if (["length", "height", "height_cm", "length_cm"].includes(key)) return "length";
  if (["head", "head_cm", "head_circumference", "head_circumference_cm", "hc"].includes(key)) {
    return "head";
  }
  return null;
}

function convertWeightToKg(value: number, unit: unknown) {
  if (typeof unit !== "string") return value;
  const normalized = unit.trim().toLowerCase();
  if (["kg", "kilogram", "kilograms"].includes(normalized)) return value;
  if (["g", "gram", "grams"].includes(normalized)) return value / 1000;
  if (["lb", "lbs", "pound", "pounds"].includes(normalized)) return value * 0.45359237;
  if (["oz", "ounce", "ounces"].includes(normalized)) return value * 0.0283495231;
  return value;
}

function convertLengthToCm(value: number, unit: unknown) {
  if (typeof unit !== "string") return value;
  const normalized = unit.trim().toLowerCase();
  if (["cm", "centimeter", "centimeters"].includes(normalized)) return value;
  if (["mm", "millimeter", "millimeters"].includes(normalized)) return value / 10;
  if (["m", "meter", "meters"].includes(normalized)) return value * 100;
  if (["in", "inch", "inches"].includes(normalized)) return value * 2.54;
  return value;
}

function normalizeBottlePayload(payload: Record<string, any>) {
  const amountMl =
    asFiniteNumber(payload.amountMl) ??
    asFiniteNumber(payload.amount_ml) ??
    asFiniteNumber(payload.volumeMl) ??
    asFiniteNumber(payload.volume_ml) ??
    asFiniteNumber(payload.volume);
  const contentType = normalizeEnum(
    payload.contentType ?? payload.content_type ?? payload.milkType ?? payload.milk_type,
    ["formula", "breast_milk", "cow_milk"],
    "formula"
  );
  const formulaName = asTrimmedString(payload.formulaName ?? payload.formula_name);

  return {
    ...payload,
    ...(amountMl != null ? { amountMl } : {}),
    ...(contentType ? { contentType } : {}),
    ...(formulaName ? { formulaName } : {}),
  };
}

function normalizeBreastPayload(payload: Record<string, any>) {
  const durationMin =
    asFiniteNumber(payload.durationMin) ??
    asFiniteNumber(payload.duration_min) ??
    asFiniteNumber(payload.duration);
  const side = normalizeEnum(payload.side, ["left", "right", "both"], "left");

  return {
    ...payload,
    ...(durationMin != null ? { durationMin } : {}),
    ...(side ? { side } : {}),
  };
}

function normalizePumpPayload(payload: Record<string, any>) {
  const amountMl =
    asFiniteNumber(payload.amountMl) ??
    asFiniteNumber(payload.amount_ml) ??
    asFiniteNumber(payload.volumeMl) ??
    asFiniteNumber(payload.volume_ml) ??
    asFiniteNumber(payload.volume);

  return {
    ...payload,
    ...(amountMl != null ? { amountMl } : {}),
  };
}

function normalizeDiaperPayload(payload: Record<string, any>) {
  const rawKind = payload.kind ?? payload.type ?? payload.diaperType ?? payload.diaper_type;
  const normalizedKind = typeof rawKind === "string"
    ? rawKind.trim().toLowerCase().replace(/[\s-]+/g, "_")
    : undefined;
  const kindAliases: Record<string, string> = {
    pee: "wet",
    poop: "dirty",
    poo: "dirty",
    stool: "dirty",
    poop_and_pee: "mixed",
    wet_and_dirty: "mixed",
  };
  const kind = normalizeEnum(
    kindAliases[normalizedKind ?? ""] ?? normalizedKind,
    ["wet", "dirty", "dry", "mixed"],
    "wet"
  );
  const texture = normalizeEnum(payload.texture, ["runny", "mucousy", "mushy", "solid", "pebbles"]);
  const color = normalizeEnum(payload.color, ["black", "green", "yellow", "brown", "red", "gray"]);
  const blowout = asBoolean(payload.blowout);
  const rash = asBoolean(payload.rash);

  return {
    ...payload,
    ...(kind ? { kind } : {}),
    ...(texture ? { texture } : {}),
    ...(color ? { color } : {}),
    ...(blowout != null ? { blowout } : {}),
    ...(rash != null ? { rash } : {}),
  };
}

function normalizeSleepPayload(payload: Record<string, any>) {
  const now = new Date().toISOString();
  const kind = normalizeEnum(payload.kind, ["nap", "night"], "nap");

  return {
    ...payload,
    ...(kind ? { kind } : {}),
    startTs:
      payload.startTs == null
        ? payload.startTs
        : normalizeTimestamp(payload.startTs, now),
    endTs:
      payload.endTs == null
        ? payload.endTs
        : normalizeTimestamp(payload.endTs, now),
  };
}

function normalizeMedPayload(payload: Record<string, any>) {
  const medicineName = asTrimmedString(payload.medicineName ?? payload.medicine_name ?? payload.name);
  const doseValue =
    asFiniteNumber(payload.doseValue) ??
    asFiniteNumber(payload.dose_value) ??
    asFiniteNumber(payload.dose);
  const doseUnit = asTrimmedString(payload.doseUnit ?? payload.dose_unit ?? payload.unit)?.toLowerCase();
  const outcome = normalizeEnum(payload.outcome, ["taken", "skipped", "vomited"], "taken");

  return {
    ...payload,
    ...(medicineName ? { medicineName } : {}),
    ...(doseValue != null ? { doseValue } : {}),
    ...(doseUnit ? { doseUnit } : {}),
    ...(outcome ? { outcome } : {}),
  };
}

function normalizeNotePayload(payload: Record<string, any>) {
  const text = asTrimmedString(payload.text ?? payload.note ?? payload.notes ?? payload.body);
  return {
    ...payload,
    ...(text ? { text } : {}),
  };
}

function normalizeGrowthPayload(payload: Record<string, any>) {
  const directWeight =
    asFiniteNumber(payload.weightKg) ??
    asFiniteNumber(payload.weight_kg) ??
    asFiniteNumber(payload.weight);
  const directHeight =
    asFiniteNumber(payload.heightCm) ??
    asFiniteNumber(payload.height_cm) ??
    asFiniteNumber(payload.lengthCm) ??
    asFiniteNumber(payload.length_cm) ??
    asFiniteNumber(payload.height) ??
    asFiniteNumber(payload.length);
  const directHead =
    asFiniteNumber(payload.headCm) ??
    asFiniteNumber(payload.head_cm) ??
    asFiniteNumber(payload.headCircumferenceCm) ??
    asFiniteNumber(payload.head_circumference_cm) ??
    asFiniteNumber(payload.headCircumference) ??
    asFiniteNumber(payload.head_circumference) ??
    asFiniteNumber(payload.head);

  const genericMetric = normalizeGrowthMetric(payload.metric);
  const genericValue = asFiniteNumber(payload.value);

  let weightKg = directWeight;
  let heightCm = directHeight;
  let headCm = directHead;

  if (genericMetric && genericValue != null) {
    if (genericMetric === "weight" && weightKg == null) {
      weightKg = convertWeightToKg(genericValue, payload.unit);
    }
    if (genericMetric === "length" && heightCm == null) {
      heightCm = convertLengthToCm(genericValue, payload.unit);
    }
    if (genericMetric === "head" && headCm == null) {
      headCm = convertLengthToCm(genericValue, payload.unit);
    }
  }

  return {
    ...payload,
    ...(weightKg != null ? { weightKg: round(weightKg, 3) } : {}),
    ...(heightCm != null ? { heightCm: round(heightCm, 2) } : {}),
    ...(headCm != null ? { headCm: round(headCm, 2) } : {}),
  };
}

export function normalizeEventPayload(type: string, payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const normalizedType = normalizeEventType(type);
  const record = payload as Record<string, any>;

  switch (normalizedType) {
    case "FEED_BOTTLE":
      return normalizeBottlePayload(record);
    case "FEED_BREAST":
      return normalizeBreastPayload(record);
    case "PUMP":
      return normalizePumpPayload(record);
    case "DIAPER":
      return normalizeDiaperPayload(record);
    case "SLEEP":
      return normalizeSleepPayload(record);
    case "MED_DOSE":
      return normalizeMedPayload(record);
    case "NOTE":
      return normalizeNotePayload(record);
    case "GROWTH":
      return normalizeGrowthPayload(record);
    default:
      return record;
  }
}

export function validateEventPayload(type: string, payload: unknown): string | null {
  const normalizedType = normalizeEventType(type);
  const normalizedPayload = normalizeEventPayload(normalizedType, payload);
  const record =
    normalizedPayload && typeof normalizedPayload === "object" && !Array.isArray(normalizedPayload)
      ? (normalizedPayload as Record<string, any>)
      : {};

  switch (normalizedType) {
    case "FEED_BOTTLE":
      return record.amountMl != null ? null : "Bottle feeds require amountMl.";
    case "FEED_BREAST":
      return record.durationMin != null ? null : "Breast feeds require durationMin.";
    case "PUMP":
      return record.amountMl != null ? null : "Pump events require amountMl.";
    case "DIAPER":
      return record.kind ? null : "Diaper events require kind.";
    case "SLEEP":
      return record.startTs ? null : "Sleep events require startTs.";
    case "MED_DOSE":
      return record.medicineName ? null : "Medicine events require medicineName.";
    case "NOTE":
      return record.text ? null : "Notes require text.";
    case "GROWTH":
      return record.weightKg != null || record.heightCm != null || record.headCm != null
        ? null
        : "Growth events require at least one measurement: weightKg, heightCm, or headCm.";
    default:
      return null;
  }
}
