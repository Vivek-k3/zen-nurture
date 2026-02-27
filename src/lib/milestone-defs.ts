export type MilestoneCategory =
  | "physical"
  | "social"
  | "cognitive"
  | "feeding"
  | "sleep"
  | "health";

export interface MilestoneDef {
  key: string;
  title: string;
  category: MilestoneCategory;
  icon: string;
  typicalMonths?: string;
}

export const MILESTONE_CATEGORIES: Record<MilestoneCategory, { label: string; color: string; icon: string }> = {
  physical:  { label: "Physical",  color: "sage",      icon: "directions_run" },
  social:    { label: "Social",    color: "clay",      icon: "mood" },
  cognitive: { label: "Cognitive", color: "dusty-blue", icon: "psychology" },
  feeding:   { label: "Feeding",   color: "sage",      icon: "restaurant" },
  sleep:     { label: "Sleep",     color: "night",     icon: "bedtime" },
  health:    { label: "Health",    color: "alert-red", icon: "vaccines" },
};

export const MILESTONES: MilestoneDef[] = [
  // Physical
  { key: "holds_head_up",       title: "Holds head up",        category: "physical", icon: "child_friendly",    typicalMonths: "1–4" },
  { key: "rolls_over",          title: "Rolls over",           category: "physical", icon: "sync",              typicalMonths: "4–6" },
  { key: "sits_without_support",title: "Sits without support", category: "physical", icon: "accessibility",     typicalMonths: "6–8" },
  { key: "crawls",              title: "Crawls",               category: "physical", icon: "directions_walk",   typicalMonths: "6–10" },
  { key: "pulls_to_stand",      title: "Pulls to stand",       category: "physical", icon: "accessibility_new", typicalMonths: "8–12" },
  { key: "first_steps",         title: "First steps",          category: "physical", icon: "directions_run",    typicalMonths: "9–15" },
  { key: "walks_independently", title: "Walks independently",  category: "physical", icon: "directions_walk",   typicalMonths: "12–18" },
  { key: "climbs_stairs",       title: "Climbs stairs",        category: "physical", icon: "stairs",            typicalMonths: "12–24" },

  // Social
  { key: "first_smile",         title: "First social smile",   category: "social", icon: "mood",             typicalMonths: "1–3" },
  { key: "laughs",              title: "First laugh",          category: "social", icon: "sentiment_very_satisfied", typicalMonths: "3–4" },
  { key: "recognizes_parents",  title: "Recognizes parents",   category: "social", icon: "family_restroom",  typicalMonths: "2–4" },
  { key: "stranger_anxiety",    title: "Stranger anxiety",     category: "social", icon: "person_off",       typicalMonths: "6–9" },
  { key: "waves_bye",           title: "Waves bye-bye",        category: "social", icon: "waving_hand",      typicalMonths: "9–12" },
  { key: "plays_peekaboo",      title: "Plays peek-a-boo",     category: "social", icon: "visibility_off",   typicalMonths: "6–9" },
  { key: "first_kiss_hug",      title: "First kiss or hug",    category: "social", icon: "favorite",         typicalMonths: "12–18" },
  { key: "plays_with_others",   title: "Plays with others",    category: "social", icon: "group",            typicalMonths: "18–24" },

  // Cognitive
  { key: "follows_objects",     title: "Follows objects",      category: "cognitive", icon: "visibility",     typicalMonths: "1–3" },
  { key: "reaches_for_toys",    title: "Reaches for toys",     category: "cognitive", icon: "toys",           typicalMonths: "3–5" },
  { key: "transfers_objects",   title: "Transfers objects",     category: "cognitive", icon: "swap_horiz",    typicalMonths: "5–7" },
  { key: "first_word",          title: "First word",           category: "cognitive", icon: "record_voice_over", typicalMonths: "10–14" },
  { key: "points_at_things",    title: "Points at things",     category: "cognitive", icon: "touch_app",      typicalMonths: "9–14" },
  { key: "follows_instructions",title: "Follows instructions",  category: "cognitive", icon: "hearing",       typicalMonths: "12–18" },
  { key: "two_word_phrases",    title: "Two-word phrases",     category: "cognitive", icon: "chat",           typicalMonths: "18–24" },
  { key: "knows_body_parts",    title: "Knows body parts",     category: "cognitive", icon: "accessibility",  typicalMonths: "15–20" },

  // Feeding
  { key: "first_solids",        title: "First solid food",     category: "feeding", icon: "restaurant",       typicalMonths: "4–6" },
  { key: "drinks_from_cup",     title: "Drinks from cup",      category: "feeding", icon: "local_cafe",       typicalMonths: "6–12" },
  { key: "self_feeds_finger",   title: "Self-feeds (fingers)",  category: "feeding", icon: "pan_tool",        typicalMonths: "8–10" },
  { key: "uses_spoon",          title: "Uses spoon",           category: "feeding", icon: "restaurant_menu",  typicalMonths: "12–18" },
  { key: "weaned_off_bottle",   title: "Weaned off bottle",    category: "feeding", icon: "no_drinks",        typicalMonths: "12–18" },

  // Sleep
  { key: "sleeps_through_night",title: "Sleeps through night", category: "sleep", icon: "nightlight",         typicalMonths: "4–12" },
  { key: "drops_to_two_naps",   title: "Drops to 2 naps",     category: "sleep", icon: "bedtime",            typicalMonths: "6–9" },
  { key: "drops_to_one_nap",    title: "Drops to 1 nap",      category: "sleep", icon: "bedtime_off",        typicalMonths: "12–18" },

  // Health
  { key: "first_tooth",         title: "First tooth",          category: "health", icon: "dentistry",          typicalMonths: "4–10" },
  { key: "first_haircut",       title: "First haircut",        category: "health", icon: "content_cut",        typicalMonths: "6–18" },
  { key: "first_vaccination",   title: "First vaccination",    category: "health", icon: "vaccines",           typicalMonths: "0–2" },
];
