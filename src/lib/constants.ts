export const EVENT_TYPES = {
  FEED_BOTTLE: "FEED_BOTTLE",
  FEED_BREAST: "FEED_BREAST",
  PUMP: "PUMP",
  DIAPER: "DIAPER",
  MED_DOSE: "MED_DOSE",
  SLEEP: "SLEEP",
  GROWTH: "GROWTH",
  NOTE: "NOTE",
  VACCINE_DOSE: "VACCINE_DOSE",
} as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  [EVENT_TYPES.FEED_BOTTLE]: "Bottle Feed",
  [EVENT_TYPES.FEED_BREAST]: "Breast Feed",
  [EVENT_TYPES.PUMP]: "Pumping",
  [EVENT_TYPES.DIAPER]: "Diaper",
  [EVENT_TYPES.MED_DOSE]: "Medicine",
  [EVENT_TYPES.SLEEP]: "Sleep",
  [EVENT_TYPES.GROWTH]: "Growth",
  [EVENT_TYPES.NOTE]: "Note",
  [EVENT_TYPES.VACCINE_DOSE]: "Vaccine",
};

export const EVENT_TYPE_ICONS: Record<string, string> = {
  [EVENT_TYPES.FEED_BOTTLE]: "water_drop",
  [EVENT_TYPES.FEED_BREAST]: "child_friendly",
  [EVENT_TYPES.PUMP]: "electric_bolt",
  [EVENT_TYPES.DIAPER]: "baby_changing_station",
  [EVENT_TYPES.MED_DOSE]: "medication",
  [EVENT_TYPES.SLEEP]: "bedtime",
  [EVENT_TYPES.GROWTH]: "straighten",
  [EVENT_TYPES.NOTE]: "edit_note",
  [EVENT_TYPES.VACCINE_DOSE]: "vaccines",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  [EVENT_TYPES.FEED_BOTTLE]: "sage",
  [EVENT_TYPES.FEED_BREAST]: "sage",
  [EVENT_TYPES.PUMP]: "dusty-blue",
  [EVENT_TYPES.DIAPER]: "clay",
  [EVENT_TYPES.MED_DOSE]: "alert-red",
  [EVENT_TYPES.SLEEP]: "night",
  [EVENT_TYPES.GROWTH]: "espresso",
  [EVENT_TYPES.NOTE]: "muted",
  [EVENT_TYPES.VACCINE_DOSE]: "sage",
};

type ColorClassSet = {
  text: string;
  bgLight: string;
  border: string;
  borderStrong: string;
  hoverBorder: string;
};

const COLOR_CLASS_MAP: Record<string, ColorClassSet> = {
  sage: {
    text: "text-sage",
    bgLight: "bg-sage/10",
    border: "border-sage/20",
    borderStrong: "border-sage/40",
    hoverBorder: "hover:border-sage/30",
  },
  clay: {
    text: "text-clay",
    bgLight: "bg-clay/10",
    border: "border-clay/20",
    borderStrong: "border-clay/40",
    hoverBorder: "hover:border-clay/30",
  },
  night: {
    text: "text-night",
    bgLight: "bg-night/10",
    border: "border-night/20",
    borderStrong: "border-night/40",
    hoverBorder: "hover:border-night/30",
  },
  "dusty-blue": {
    text: "text-dusty-blue",
    bgLight: "bg-dusty-blue/10",
    border: "border-dusty-blue/20",
    borderStrong: "border-dusty-blue/40",
    hoverBorder: "hover:border-dusty-blue/30",
  },
  "alert-red": {
    text: "text-alert-red",
    bgLight: "bg-alert-red/10",
    border: "border-alert-red/20",
    borderStrong: "border-alert-red/40",
    hoverBorder: "hover:border-alert-red/30",
  },
  espresso: {
    text: "text-espresso",
    bgLight: "bg-espresso/10",
    border: "border-espresso/20",
    borderStrong: "border-espresso/40",
    hoverBorder: "hover:border-espresso/30",
  },
  muted: {
    text: "text-muted",
    bgLight: "bg-muted/10",
    border: "border-muted/20",
    borderStrong: "border-muted/40",
    hoverBorder: "hover:border-muted/30",
  },
};

export function getColorClasses(color: string): ColorClassSet {
  return COLOR_CLASS_MAP[color] ?? COLOR_CLASS_MAP.muted;
}

const EVENT_TYPE_ALIASES: Record<string, string> = {
  feed_bottle: EVENT_TYPES.FEED_BOTTLE,
  bottle_feed: EVENT_TYPES.FEED_BOTTLE,
  bottle: EVENT_TYPES.FEED_BOTTLE,
  feed_breast: EVENT_TYPES.FEED_BREAST,
  breast_feed: EVENT_TYPES.FEED_BREAST,
  breastfeeding: EVENT_TYPES.FEED_BREAST,
  breast: EVENT_TYPES.FEED_BREAST,
  pump: EVENT_TYPES.PUMP,
  pumping: EVENT_TYPES.PUMP,
  diaper: EVENT_TYPES.DIAPER,
  nappy: EVENT_TYPES.DIAPER,
  sleep: EVENT_TYPES.SLEEP,
  nap: EVENT_TYPES.SLEEP,
  med_dose: EVENT_TYPES.MED_DOSE,
  medicine: EVENT_TYPES.MED_DOSE,
  medication: EVENT_TYPES.MED_DOSE,
  meds: EVENT_TYPES.MED_DOSE,
  note: EVENT_TYPES.NOTE,
  notes: EVENT_TYPES.NOTE,
  growth: EVENT_TYPES.GROWTH,
  vaccine_dose: EVENT_TYPES.VACCINE_DOSE,
  vaccine: EVENT_TYPES.VACCINE_DOSE,
};

export function normalizeEventType(type?: string | null): string {
  if (!type) return "";
  const upper = type.toUpperCase();
  if (EVENT_TYPE_LABELS[upper]) return upper;

  const normalizedKey = type
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return EVENT_TYPE_ALIASES[normalizedKey] ?? upper;
}

export const REMINDER_CATEGORIES = {
  FEED: "feed",
  DIAPER: "diaper",
  MEDICINE: "medicine",
  VACCINE: "vaccine",
  CUSTOM: "custom",
} as const;

export const DIAPER_KINDS = {
  WET: "wet",
  DIRTY: "dirty",
  DRY: "dry",
  MIXED: "mixed",
} as const;

export const DIAPER_TEXTURES = {
  RUNNY: "runny",
  MUCOUSY: "mucousy",
  MUSHY: "mushy",
  SOLID: "solid",
  PEBBLES: "pebbles",
} as const;

export const DIAPER_COLORS = {
  BLACK: "black",
  GREEN: "green",
  YELLOW: "yellow",
  BROWN: "brown",
  RED: "red",
  GRAY: "gray",
} as const;

export const BREAST_SIDES = {
  LEFT: "left",
  RIGHT: "right",
  BOTH: "both",
} as const;

export const SLEEP_KINDS = {
  NAP: "nap",
  NIGHT: "night",
} as const;

export const MED_OUTCOMES = {
  TAKEN: "taken",
  SKIPPED: "skipped",
  VOMITED: "vomited",
} as const;

export const CAREGIVER_COLORS = [
  "#7C9A82",
  "#C4A484",
  "#6B8CAE",
  "#E57373",
  "#9C7CF4",
  "#F4B942",
  "#4DB6AC",
  "#7986CB",
];

export const DEFAULT_FORMULAS = [
  "Enfamil",
  "Similac",
  "Nestle Nan",
  "Aptamil",
  "Cow Milk",
];

export const DEFAULT_MEDICINES = [
  "Paracetamol (Crocin)",
  "Ibuprofen",
  "Vitamin D",
  "Iron Drops",
  "Zinc Syrup",
];

export const QUICK_VOLUME_PRESETS = [30, 60, 90, 120, 150, 180];
export const QUICK_DURATION_PRESETS = [5, 10, 15, 20, 30];
