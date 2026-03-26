export interface Job {
  id: string;
  jahr: number;
  monat: string;
  kundenname: string;
  objektadresse: string;
  taetigkeit: string;
  herkunft: string;
  netto_umsatz: number | null;
  rohertrag: number | null;
  angebot: string;
  datum: string;
  created_at?: string;
}

export interface Config {
  id: string;
  homepage_kosten: number;
  ads_setup_kosten: number;
  pflegekosten_monat: number;
  operative_marge_pct: number;
  avg_auftraege_monat: number;
}

export interface MonthlyROI {
  monat: string;
  datum: string;
  google_ads_ausgaben: number;
  pflegekosten: number;
  kosten_gesamt: number;
  netto_umsatz: number;
  rohertrag: number;
  operative_marge: number;
  gesamtergebnis: number;
  kum_gesamtkosten: number;
  kum_operative_marge: number;
  kum_ergebnis: number;
  roi_pct: number;
  roi_pa_pct: number;
}

export interface Upload {
  id: string;
  filename: string;
  rows_imported: number;
  rows_skipped: number;
  column_mapping: Record<string, string> | null;
  created_at: string;
}

// The DB columns that can be mapped from an import file
export const IMPORTABLE_FIELDS = [
  { key: "jahr", label: "Jahr", type: "number" },
  { key: "monat", label: "Monat", type: "text" },
  { key: "kundenname", label: "Kundenname", type: "text" },
  { key: "objektadresse", label: "Objektadresse", type: "text" },
  { key: "taetigkeit", label: "Tätigkeit", type: "text" },
  { key: "herkunft", label: "Herkunft", type: "text" },
  { key: "netto_umsatz", label: "Netto-Umsatz", type: "number" },
  { key: "rohertrag", label: "Rohertrag", type: "number" },
  { key: "angebot", label: "Angebot", type: "text" },
  { key: "datum", label: "Datum", type: "date" },
] as const;

// Auto-mapping: known xlsx header → DB column
export const AUTO_COLUMN_MAP: Record<string, string> = {
  "jahr": "jahr",
  "monat": "monat",
  "kundenname": "kundenname",
  "objektadresse": "objektadresse",
  "tätigkeit": "taetigkeit",
  "tatigkeit": "taetigkeit",
  "taetigkeit": "taetigkeit",
  "herkunft": "herkunft",
  "netto-umsatz": "netto_umsatz",
  "nettoumsatz": "netto_umsatz",
  "netto_umsatz": "netto_umsatz",
  "umsatz": "netto_umsatz",
  "rohertrag": "rohertrag",
  "angebot": "angebot",
  "datum": "datum",
  "datum (hilfe):": "datum",
  "datum (hilfe)": "datum",
  "date": "datum",
};

export const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
] as const;

export const HERKUNFT_OPTIONS = [
  "Google Ads",
  "Kontaktformular",
  "Fenster Dichtungprüfung",
  "Fenster Dichtigkeitsprüfung",
  "Fenster Reparatur",
  "Tischlerei in der Nähe",
  "Empfehlung",
  "Sonstige"
] as const;
