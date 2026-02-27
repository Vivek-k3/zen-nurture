export interface FormulaEntry {
  brand: string;
  name: string;
  stage?: string;
  region?: string;
}

export const FORMULA_DATABASE: FormulaEntry[] = [
  // === INDIA-FIRST ===
  // Nestle NAN
  { brand: "Nestle", name: "NAN PRO 1", stage: "0–6m", region: "IN" },
  { brand: "Nestle", name: "NAN PRO 2", stage: "6–12m", region: "IN" },
  { brand: "Nestle", name: "NAN PRO 3", stage: "12–18m", region: "IN" },
  { brand: "Nestle", name: "NAN PRO 4", stage: "18–24m", region: "IN" },
  { brand: "Nestle", name: "NAN Excella PRO 1", stage: "0–6m", region: "IN" },
  { brand: "Nestle", name: "NAN Excella PRO 2", stage: "6–12m", region: "IN" },
  { brand: "Nestle", name: "NAN Excella PRO 3", stage: "12m+", region: "IN" },
  { brand: "Nestle", name: "NAN Comfort", stage: "0–12m" },
  { brand: "Nestle", name: "NAN HA 1 (Hypoallergenic)", stage: "0–6m" },
  { brand: "Nestle", name: "NAN HA 2 (Hypoallergenic)", stage: "6–12m" },
  { brand: "Nestle", name: "NAN AL 110 (Lactose-Free)", stage: "0m+" },
  { brand: "Nestle", name: "NAN Sensitive", stage: "0–12m" },
  { brand: "Nestle", name: "PreNAN (Preterm)", stage: "Preterm" },
  { brand: "Nestle", name: "Lactogen 1", stage: "0–6m", region: "IN" },
  { brand: "Nestle", name: "Lactogen 2", stage: "6–12m", region: "IN" },
  { brand: "Nestle", name: "Lactogen 3", stage: "12–18m", region: "IN" },
  { brand: "Nestle", name: "Lactogen 4", stage: "18–24m", region: "IN" },

  // Similac (Abbott)
  { brand: "Abbott", name: "Similac Advance 1", stage: "0–6m" },
  { brand: "Abbott", name: "Similac Advance 2", stage: "6–12m" },
  { brand: "Abbott", name: "Similac Advance 3", stage: "12–24m" },
  { brand: "Abbott", name: "Similac IQ+", stage: "0–6m", region: "IN" },
  { brand: "Abbott", name: "Similac Total Comfort 1", stage: "0–6m" },
  { brand: "Abbott", name: "Similac Total Comfort 2", stage: "6–12m" },
  { brand: "Abbott", name: "Similac Sensitive", stage: "0–12m" },
  { brand: "Abbott", name: "Similac Soy Isomil", stage: "0–12m" },
  { brand: "Abbott", name: "Similac Alimentum", stage: "0–12m" },
  { brand: "Abbott", name: "Similac NeoSure (Preterm)", stage: "Preterm" },
  { brand: "Abbott", name: "Similac 360 Total Care", stage: "0–12m" },
  { brand: "Abbott", name: "Similac Pro-Advance", stage: "0–12m" },
  { brand: "Abbott", name: "Similac Pro-Sensitive", stage: "0–12m" },
  { brand: "Abbott", name: "Similac Organic", stage: "0–12m" },

  // Enfamil (Mead Johnson / Reckitt)
  { brand: "Enfamil", name: "Enfamil A+ Stage 1", stage: "0–6m" },
  { brand: "Enfamil", name: "Enfamil A+ Stage 2", stage: "6–12m" },
  { brand: "Enfamil", name: "Enfamil A+ Stage 3", stage: "12–24m" },
  { brand: "Enfamil", name: "Enfamil NeuroPro", stage: "0–12m" },
  { brand: "Enfamil", name: "Enfamil NeuroPro Gentlease", stage: "0–12m" },
  { brand: "Enfamil", name: "Enfamil NeuroPro Sensitive", stage: "0–12m" },
  { brand: "Enfamil", name: "Enfamil AR (Anti-Reflux)", stage: "0–12m" },
  { brand: "Enfamil", name: "Enfamil Premature (Preterm)", stage: "Preterm" },
  { brand: "Enfamil", name: "Enfamil Reguline", stage: "0–12m" },
  { brand: "Enfamil", name: "Nutramigen (Hypoallergenic)", stage: "0–12m" },
  { brand: "Enfamil", name: "Pregestimil", stage: "0–12m" },

  // Aptamil (Danone / Nutricia)
  { brand: "Aptamil", name: "Aptamil 1", stage: "0–6m" },
  { brand: "Aptamil", name: "Aptamil 2", stage: "6–12m" },
  { brand: "Aptamil", name: "Aptamil 3", stage: "12–24m" },
  { brand: "Aptamil", name: "Aptamil Gold+ 1", stage: "0–6m" },
  { brand: "Aptamil", name: "Aptamil Gold+ 2", stage: "6–12m" },
  { brand: "Aptamil", name: "Aptamil Profutura 1", stage: "0–6m" },
  { brand: "Aptamil", name: "Aptamil Profutura 2", stage: "6–12m" },
  { brand: "Aptamil", name: "Aptamil HA (Hypoallergenic)", stage: "0–6m" },
  { brand: "Aptamil", name: "Aptamil Pepti (Allergy)", stage: "0–12m" },
  { brand: "Aptamil", name: "Aptamil Comfort", stage: "0–12m" },
  { brand: "Aptamil", name: "Aptamil Anti-Reflux", stage: "0–12m" },

  // Dexolac (Wockhardt) — India
  { brand: "Dexolac", name: "Dexolac 1", stage: "0–6m", region: "IN" },
  { brand: "Dexolac", name: "Dexolac 2", stage: "6–12m", region: "IN" },
  { brand: "Dexolac", name: "Dexolac 3", stage: "12–24m", region: "IN" },
  { brand: "Dexolac", name: "Dexolac Premium", stage: "0–6m", region: "IN" },

  // Farex (Heinz) — India
  { brand: "Farex", name: "Farex 1", stage: "0–6m", region: "IN" },
  { brand: "Farex", name: "Farex 2", stage: "6–12m", region: "IN" },

  // Nandhini / Amul — India
  { brand: "Amul", name: "Amulspray Infant Milk Food", stage: "0–12m", region: "IN" },

  // HiPP
  { brand: "HiPP", name: "HiPP Organic Combiotic 1", stage: "0–6m" },
  { brand: "HiPP", name: "HiPP Organic Combiotic 2", stage: "6–12m" },
  { brand: "HiPP", name: "HiPP Organic Combiotic 3", stage: "12m+" },
  { brand: "HiPP", name: "HiPP HA Combiotic (Hypoallergenic)", stage: "0–6m" },
  { brand: "HiPP", name: "HiPP Anti-Reflux", stage: "0–12m" },
  { brand: "HiPP", name: "HiPP Comfort", stage: "0–12m" },

  // Holle
  { brand: "Holle", name: "Holle Organic Infant 1", stage: "0–6m" },
  { brand: "Holle", name: "Holle Organic Follow-On 2", stage: "6–12m" },
  { brand: "Holle", name: "Holle Organic Toddler 3", stage: "12m+" },
  { brand: "Holle", name: "Holle Goat Milk 1", stage: "0–6m" },
  { brand: "Holle", name: "Holle Goat Milk 2", stage: "6–12m" },
  { brand: "Holle", name: "Holle Goat Milk 3", stage: "12m+" },

  // Kendamil
  { brand: "Kendamil", name: "Kendamil Classic 1", stage: "0–6m" },
  { brand: "Kendamil", name: "Kendamil Classic 2", stage: "6–12m" },
  { brand: "Kendamil", name: "Kendamil Classic 3", stage: "12m+" },
  { brand: "Kendamil", name: "Kendamil Organic 1", stage: "0–6m" },
  { brand: "Kendamil", name: "Kendamil Organic 2", stage: "6–12m" },
  { brand: "Kendamil", name: "Kendamil Goat 1", stage: "0–6m" },
  { brand: "Kendamil", name: "Kendamil Goat 2", stage: "6–12m" },

  // Kabrita
  { brand: "Kabrita", name: "Kabrita Goat Milk 1", stage: "0–6m" },
  { brand: "Kabrita", name: "Kabrita Goat Milk 2", stage: "6–12m" },
  { brand: "Kabrita", name: "Kabrita Goat Milk 3", stage: "12m+" },

  // Burt's Bees / Earth's Best
  { brand: "Earth's Best", name: "Earth's Best Organic Infant", stage: "0–12m" },
  { brand: "Earth's Best", name: "Earth's Best Organic Sensitivity", stage: "0–12m" },

  // Gerber (Nestle)
  { brand: "Gerber", name: "Gerber Good Start GentlePro", stage: "0–12m" },
  { brand: "Gerber", name: "Gerber Good Start SoothePro", stage: "0–12m" },
  { brand: "Gerber", name: "Gerber Good Start Extensive HA", stage: "0–12m" },

  // S-26 (Wyeth)
  { brand: "S-26", name: "S-26 Gold 1", stage: "0–6m" },
  { brand: "S-26", name: "S-26 Gold 2", stage: "6–12m" },
  { brand: "S-26", name: "S-26 Gold 3", stage: "12–36m" },
  { brand: "S-26", name: "S-26 Promil Gold (Follow-Up)", stage: "6–12m" },
  { brand: "S-26", name: "S-26 HA (Hypoallergenic)", stage: "0–12m" },

  // Friso (FrieslandCampina)
  { brand: "Friso", name: "Friso Gold 1", stage: "0–6m" },
  { brand: "Friso", name: "Friso Gold 2", stage: "6–12m" },
  { brand: "Friso", name: "Friso Gold 3", stage: "12–36m" },
  { brand: "Friso", name: "Friscolac 1", stage: "0–6m" },

  // Other types
  { brand: "Other", name: "Cow Milk (Fresh)", stage: "12m+" },
  { brand: "Other", name: "Cow Milk (Boiled)", stage: "12m+" },
  { brand: "Other", name: "Buffalo Milk", stage: "12m+", region: "IN" },
  { brand: "Other", name: "Goat Milk (Fresh)", stage: "12m+" },
  { brand: "Other", name: "Soy Milk", stage: "6m+" },
  { brand: "Other", name: "Oat Milk", stage: "12m+" },
  { brand: "Other", name: "Breast Milk (Stored/Thawed)", stage: "0m+" },
];

export const FORMULA_BRANDS = [...new Set(FORMULA_DATABASE.map((f) => f.brand))];

export function searchFormulas(query: string): FormulaEntry[] {
  if (!query.trim()) return FORMULA_DATABASE;
  const q = query.toLowerCase();
  return FORMULA_DATABASE.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.brand.toLowerCase().includes(q) ||
      (f.stage?.toLowerCase().includes(q) ?? false)
  );
}
