// lib/drugs.ts
// Common Egyptian drug list used for prescription autocomplete in NewVisitPanel.
// Frequency values must match the FREQUENCY_OPTIONS dropdown in NewVisitPanel.tsx.

export type DrugEntry = {
  name: string
  defaultDose: string
  defaultFrequency: string
  defaultDuration: string
}

export const DRUGS: DrugEntry[] = [
  { name: "Augmentin 625mg",      defaultDose: "625mg",   defaultFrequency: "مرتين يومياً",        defaultDuration: "7 أيام" },
  { name: "Augmentin 1g",         defaultDose: "1g",      defaultFrequency: "مرتين يومياً",        defaultDuration: "7 أيام" },
  { name: "Amoxil 500mg",         defaultDose: "500mg",   defaultFrequency: "ثلاث مرات يومياً",    defaultDuration: "7 أيام" },
  { name: "Zithromax 500mg",      defaultDose: "500mg",   defaultFrequency: "مرة يومياً",          defaultDuration: "3 أيام" },
  { name: "Klacid 500mg",         defaultDose: "500mg",   defaultFrequency: "مرتين يومياً",        defaultDuration: "7 أيام" },
  { name: "Ciprobay 500mg",       defaultDose: "500mg",   defaultFrequency: "مرتين يومياً",        defaultDuration: "7 أيام" },
  { name: "Doxycycline 100mg",    defaultDose: "100mg",   defaultFrequency: "مرتين يومياً",        defaultDuration: "7 أيام" },
  { name: "Flagyl 500mg",         defaultDose: "500mg",   defaultFrequency: "ثلاث مرات يومياً",    defaultDuration: "7 أيام" },
  { name: "Diflucan 150mg",       defaultDose: "150mg",   defaultFrequency: "مرة يومياً",          defaultDuration: "3 أيام" },
  { name: "Valtrex 500mg",        defaultDose: "500mg",   defaultFrequency: "مرتين يومياً",        defaultDuration: "5 أيام" },

  { name: "Panadol 500mg",        defaultDose: "500mg",   defaultFrequency: "ثلاث مرات يومياً",    defaultDuration: "5 أيام" },
  { name: "Brufen 400mg",         defaultDose: "400mg",   defaultFrequency: "ثلاث مرات يومياً",    defaultDuration: "5 أيام" },
  { name: "Voltaren 50mg",        defaultDose: "50mg",    defaultFrequency: "مرتين يومياً",        defaultDuration: "5 أيام" },
  { name: "Arcoxia 90mg",         defaultDose: "90mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "5 أيام" },

  { name: "Nexium 40mg",          defaultDose: "40mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "4 أسابيع" },
  { name: "Nexium 20mg",          defaultDose: "20mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "4 أسابيع" },
  { name: "Omez 20mg",            defaultDose: "20mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "4 أسابيع" },
  { name: "Pantoloc 40mg",        defaultDose: "40mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "4 أسابيع" },
  { name: "Zantac 150mg",         defaultDose: "150mg",   defaultFrequency: "مرتين يومياً",        defaultDuration: "4 أسابيع" },
  { name: "Gaviscon",             defaultDose: "10ml",    defaultFrequency: "أخرى",               defaultDuration: "حسب الحاجة" },
  { name: "Motilium 10mg",        defaultDose: "10mg",    defaultFrequency: "ثلاث مرات يومياً",    defaultDuration: "حسب الحاجة" },
  { name: "Dulcolax 5mg",         defaultDose: "5mg",     defaultFrequency: "عند الحاجة",          defaultDuration: "حسب الحاجة" },
  { name: "Duphalac syrup",       defaultDose: "15ml",    defaultFrequency: "مرتين يومياً",        defaultDuration: "حسب الحاجة" },
  { name: "Stemetil 5mg",         defaultDose: "5mg",     defaultFrequency: "ثلاث مرات يومياً",    defaultDuration: "5 أيام" },

  { name: "Concor 5mg",           defaultDose: "5mg",     defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Norvasc 5mg",          defaultDose: "5mg",     defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Inderal 40mg",         defaultDose: "40mg",    defaultFrequency: "مرتين يومياً",        defaultDuration: "مستمر" },
  { name: "Tenormin 50mg",        defaultDose: "50mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Tritace 5mg",          defaultDose: "5mg",     defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Coversyl 5mg",         defaultDose: "5mg",     defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Lasix 40mg",           defaultDose: "40mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Aldactone 25mg",       defaultDose: "25mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Aldactone 50mg",       defaultDose: "50mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Plavix 75mg",          defaultDose: "75mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },

  { name: "Glucophage 500mg",     defaultDose: "500mg",   defaultFrequency: "مرتين يومياً",        defaultDuration: "مستمر" },
  { name: "Glucophage 1000mg",    defaultDose: "1000mg",  defaultFrequency: "مرتين يومياً",        defaultDuration: "مستمر" },
  { name: "Diamicron 30mg",       defaultDose: "30mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Januvia 100mg",        defaultDose: "100mg",   defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Jardiance 10mg",       defaultDose: "10mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Forxiga 10mg",         defaultDose: "10mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },

  { name: "Lipitor 20mg",         defaultDose: "20mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Crestor 10mg",         defaultDose: "10mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },

  { name: "Singulair 10mg",       defaultDose: "10mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "مستمر" },
  { name: "Ventolin inhaler",     defaultDose: "جرعتان", defaultFrequency: "عند الحاجة",          defaultDuration: "حسب الحاجة" },
  { name: "Becotide inhaler",     defaultDose: "جرعتان", defaultFrequency: "مرتين يومياً",        defaultDuration: "مستمر" },

  { name: "Clarityne 10mg",       defaultDose: "10mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "حسب الحاجة" },
  { name: "Zyrtec 10mg",          defaultDose: "10mg",    defaultFrequency: "مرة يومياً",          defaultDuration: "حسب الحاجة" },
  { name: "Telfast 180mg",        defaultDose: "180mg",   defaultFrequency: "مرة يومياً",          defaultDuration: "حسب الحاجة" },

  { name: "Neurontin 300mg",      defaultDose: "300mg",   defaultFrequency: "ثلاث مرات يومياً",    defaultDuration: "مستمر" },
  { name: "Lyrica 75mg",          defaultDose: "75mg",    defaultFrequency: "مرتين يومياً",        defaultDuration: "مستمر" },
]
