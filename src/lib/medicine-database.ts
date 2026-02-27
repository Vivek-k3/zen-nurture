export interface MedicineEntry {
  name: string;
  category: string;
  form?: string;
  notes?: string;
}

export type MedicineCategory =
  | "fever_pain"
  | "vitamins"
  | "digestive"
  | "respiratory"
  | "allergy"
  | "skin"
  | "antibiotics"
  | "vaccines"
  | "eye_ear"
  | "other";

export const MEDICINE_CATEGORIES: Record<MedicineCategory, { label: string; icon: string }> = {
  fever_pain:   { label: "Fever & Pain",    icon: "thermostat" },
  vitamins:     { label: "Vitamins & Supplements", icon: "medication_liquid" },
  digestive:    { label: "Digestive",       icon: "gastroenterology" },
  respiratory:  { label: "Respiratory",     icon: "pulmonology" },
  allergy:      { label: "Allergy",         icon: "allergy" },
  skin:         { label: "Skin & Topical",  icon: "dermis" },
  antibiotics:  { label: "Antibiotics",     icon: "science" },
  vaccines:     { label: "Vaccines",        icon: "vaccines" },
  eye_ear:      { label: "Eye & Ear",       icon: "visibility" },
  other:        { label: "Other",           icon: "medication" },
};

export const MEDICINE_DATABASE: MedicineEntry[] = [
  // Fever & Pain
  { name: "Paracetamol / Acetaminophen (Crocin)", category: "fever_pain", form: "syrup/drops" },
  { name: "Ibuprofen (Brufen)", category: "fever_pain", form: "syrup", notes: "6m+ only" },
  { name: "Mefenamic Acid (Meftal-P)", category: "fever_pain", form: "syrup", notes: "Common in India" },
  { name: "Paracetamol Suppository", category: "fever_pain", form: "suppository" },
  { name: "Nimesulide", category: "fever_pain", form: "drops", notes: "Restricted in some regions" },

  // Vitamins & Supplements
  { name: "Vitamin D3 Drops", category: "vitamins", form: "drops" },
  { name: "Vitamin D3 (400 IU)", category: "vitamins", form: "drops" },
  { name: "Vitamin D3 (800 IU)", category: "vitamins", form: "drops" },
  { name: "Iron Drops (Ferrous Sulfate)", category: "vitamins", form: "drops" },
  { name: "Iron Syrup (Orofer)", category: "vitamins", form: "syrup" },
  { name: "Zinc Syrup / Drops", category: "vitamins", form: "syrup/drops" },
  { name: "Multivitamin Drops (Zincovit)", category: "vitamins", form: "drops" },
  { name: "Multivitamin Syrup", category: "vitamins", form: "syrup" },
  { name: "Calcium + Vitamin D", category: "vitamins", form: "syrup" },
  { name: "Folic Acid Drops", category: "vitamins", form: "drops" },
  { name: "Vitamin A Drops", category: "vitamins", form: "drops" },
  { name: "Vitamin B Complex Syrup", category: "vitamins", form: "syrup" },
  { name: "Vitamin C Drops", category: "vitamins", form: "drops" },
  { name: "DHA / Omega-3 Drops", category: "vitamins", form: "drops" },
  { name: "Probiotics (Bifilac / Econorm)", category: "vitamins", form: "sachet" },
  { name: "Probiotics (Enterogermina)", category: "vitamins", form: "vial" },
  { name: "Probiotics (Darolac)", category: "vitamins", form: "sachet" },

  // Digestive
  { name: "Gripe Water (Woodward's)", category: "digestive", form: "liquid" },
  { name: "Gripe Water (Dabur)", category: "digestive", form: "liquid" },
  { name: "Colic Drops (Colicaid)", category: "digestive", form: "drops" },
  { name: "Simethicone / Gas Drops (Cyclone)", category: "digestive", form: "drops" },
  { name: "Simethicone Drops (Espumisan)", category: "digestive", form: "drops" },
  { name: "Domperidone Drops (Domstal)", category: "digestive", form: "drops", notes: "For vomiting" },
  { name: "Ondansetron (Emeset)", category: "digestive", form: "syrup", notes: "Anti-emetic" },
  { name: "ORS (Oral Rehydration Salts)", category: "digestive", form: "sachet" },
  { name: "ORS (Electral)", category: "digestive", form: "sachet" },
  { name: "Lactulose Syrup (Duphalac)", category: "digestive", form: "syrup", notes: "For constipation" },
  { name: "Glycerin Suppository", category: "digestive", form: "suppository" },
  { name: "Ranitidine Syrup", category: "digestive", form: "syrup", notes: "Acid reflux" },
  { name: "Omeprazole Suspension", category: "digestive", form: "suspension", notes: "Acid reflux" },
  { name: "Racecadotril (Redotil)", category: "digestive", form: "sachet", notes: "For diarrhea" },

  // Respiratory
  { name: "Saline Nasal Drops (Nasoclear)", category: "respiratory", form: "drops" },
  { name: "Saline Nasal Spray", category: "respiratory", form: "spray" },
  { name: "Levosalbutamol Nebulization", category: "respiratory", form: "nebulizer" },
  { name: "Budesonide Nebulization", category: "respiratory", form: "nebulizer" },
  { name: "Salbutamol Syrup (Asthalin)", category: "respiratory", form: "syrup" },
  { name: "Terbutaline Syrup", category: "respiratory", form: "syrup" },
  { name: "Montelukast Granules (Montair)", category: "respiratory", form: "granules" },
  { name: "Cetirizine Drops", category: "respiratory", form: "drops" },
  { name: "Chlorpheniramine Syrup (Piriton)", category: "respiratory", form: "syrup" },
  { name: "Cough Syrup (Honitus)", category: "respiratory", form: "syrup" },
  { name: "Ambroxol Syrup", category: "respiratory", form: "syrup" },
  { name: "Bromhexine Syrup", category: "respiratory", form: "syrup" },
  { name: "Ipratropium Nebulization", category: "respiratory", form: "nebulizer" },

  // Allergy
  { name: "Cetirizine Syrup (Cetzine)", category: "allergy", form: "syrup" },
  { name: "Levocetirizine Drops (Xyzal)", category: "allergy", form: "drops" },
  { name: "Hydroxyzine Syrup (Atarax)", category: "allergy", form: "syrup" },
  { name: "Fexofenadine Syrup", category: "allergy", form: "syrup" },
  { name: "Pheniramine Syrup (Avil)", category: "allergy", form: "syrup" },

  // Skin & Topical
  { name: "Calamine Lotion", category: "skin", form: "lotion" },
  { name: "Zinc Oxide Cream (Sudocrem)", category: "skin", form: "cream" },
  { name: "Zinc Oxide Cream (Desitin)", category: "skin", form: "cream" },
  { name: "Coconut Oil", category: "skin", form: "oil" },
  { name: "Petroleum Jelly (Vaseline)", category: "skin", form: "ointment" },
  { name: "Antifungal Cream (Clotrimazole)", category: "skin", form: "cream" },
  { name: "Hydrocortisone Cream (1%)", category: "skin", form: "cream", notes: "Short-term use" },
  { name: "Mupirocin Ointment (T-Bact)", category: "skin", form: "ointment" },
  { name: "Silver Sulfadiazine Cream", category: "skin", form: "cream" },
  { name: "Cradle Cap Oil / Shampoo", category: "skin", form: "shampoo" },

  // Antibiotics
  { name: "Amoxicillin Syrup", category: "antibiotics", form: "syrup" },
  { name: "Amoxicillin + Clavulanic Acid (Augmentin)", category: "antibiotics", form: "syrup" },
  { name: "Azithromycin Syrup (Azee)", category: "antibiotics", form: "syrup" },
  { name: "Cefixime Syrup (Taxim-O)", category: "antibiotics", form: "syrup" },
  { name: "Cefpodoxime Syrup", category: "antibiotics", form: "syrup" },
  { name: "Cotrimoxazole Syrup (Bactrim)", category: "antibiotics", form: "syrup" },
  { name: "Metronidazole Syrup (Flagyl)", category: "antibiotics", form: "syrup" },

  // Eye & Ear
  { name: "Tobramycin Eye Drops", category: "eye_ear", form: "drops" },
  { name: "Ciprofloxacin Eye Drops", category: "eye_ear", form: "drops" },
  { name: "Chloramphenicol Eye Drops", category: "eye_ear", form: "drops" },
  { name: "Ear Drops (Otosporin)", category: "eye_ear", form: "drops" },
  { name: "Ear Drops (Candid)", category: "eye_ear", form: "drops" },
  { name: "Breast Milk (for eyes)", category: "eye_ear", form: "drops", notes: "Traditional remedy" },

  // Vaccines (common Indian schedule)
  { name: "BCG Vaccine", category: "vaccines", form: "injection" },
  { name: "OPV (Oral Polio Vaccine)", category: "vaccines", form: "oral drops" },
  { name: "IPV (Inactivated Polio Vaccine)", category: "vaccines", form: "injection" },
  { name: "Hepatitis B Vaccine", category: "vaccines", form: "injection" },
  { name: "Pentavalent Vaccine (DPT+HepB+Hib)", category: "vaccines", form: "injection" },
  { name: "Rotavirus Vaccine (Rotavac)", category: "vaccines", form: "oral drops" },
  { name: "PCV (Pneumococcal Vaccine)", category: "vaccines", form: "injection" },
  { name: "MMR Vaccine", category: "vaccines", form: "injection" },
  { name: "Varicella Vaccine", category: "vaccines", form: "injection" },
  { name: "Hepatitis A Vaccine", category: "vaccines", form: "injection" },
  { name: "Typhoid Vaccine", category: "vaccines", form: "injection" },
  { name: "Influenza Vaccine (Flu)", category: "vaccines", form: "injection" },
  { name: "Meningococcal Vaccine", category: "vaccines", form: "injection" },
  { name: "Japanese Encephalitis Vaccine", category: "vaccines", form: "injection" },

  // Other
  { name: "Teething Gel", category: "other", form: "gel" },
  { name: "Saline Eye Wash", category: "other", form: "liquid" },
  { name: "Nasal Aspirator (manual)", category: "other", form: "device" },
  { name: "Thermometer Reading", category: "other", form: "device", notes: "For tracking" },
];

export function searchMedicines(query: string): MedicineEntry[] {
  if (!query.trim()) return MEDICINE_DATABASE;
  const q = query.toLowerCase();
  return MEDICINE_DATABASE.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      (m.form?.toLowerCase().includes(q) ?? false) ||
      (m.notes?.toLowerCase().includes(q) ?? false)
  );
}
