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
