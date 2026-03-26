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
