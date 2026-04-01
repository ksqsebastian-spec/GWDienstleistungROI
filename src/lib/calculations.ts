import { Job, Config, MonthlyROI, MONATE } from "./types";

export function groupJobsByMonth(jobs: Job[]): Map<string, Job[]> {
  const grouped = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = `${job.jahr}-${String(MONATE.indexOf(job.monat as typeof MONATE[number]) + 1).padStart(2, "0")}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(job);
  }
  return new Map([...grouped.entries()].sort());
}

export function calculateMonthlyROI(jobs: Job[], config: Config): MonthlyROI[] {
  const grouped = groupJobsByMonth(jobs);
  const einmalig = config.homepage_kosten + config.ads_setup_kosten;

  const months: MonthlyROI[] = [];
  let kumKosten = einmalig;
  let kumMarge = 0;

  // Generate 12 months starting from the earliest job or current date
  const allDates = jobs.map(j => j.datum).filter(Boolean).sort();
  const startDate = allDates.length > 0 ? new Date(allDates[0]) : new Date();
  startDate.setDate(1);

  for (let i = 0; i < 12; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monatName = MONATE[d.getMonth()];
    const monthJobs = grouped.get(key) || [];

    const nettoUmsatz = monthJobs.reduce((s, j) => s + (j.netto_umsatz || 0), 0);
    const rohertrag = monthJobs.reduce((s, j) => s + (j.rohertrag || 0), 0);
    const operativeMarge = rohertrag * config.operative_marge_pct;

    const adsAusgaben = config.google_ads_budget;

    const pflegekosten = config.pflegekosten_monat;
    const kostenGesamt = adsAusgaben + pflegekosten;
    const gesamtergebnis = operativeMarge - kostenGesamt;

    kumKosten += kostenGesamt;
    kumMarge += operativeMarge;
    const kumErgebnis = kumMarge - kumKosten;

    const monthsElapsed = i + 1;
    const roiPct = kumKosten > 0 ? (kumErgebnis / kumKosten) * 100 : 0;
    const roiPaPct = monthsElapsed > 0 ? roiPct * (12 / monthsElapsed) : 0;

    months.push({
      monat: `${monatName} ${d.getFullYear()}`,
      datum: key,
      google_ads_ausgaben: adsAusgaben,
      pflegekosten,
      kosten_gesamt: kostenGesamt,
      netto_umsatz: nettoUmsatz,
      rohertrag,
      operative_marge: operativeMarge,
      gesamtergebnis,
      kum_gesamtkosten: kumKosten,
      kum_operative_marge: kumMarge,
      kum_ergebnis: kumErgebnis,
      roi_pct: roiPct,
      roi_pa_pct: roiPaPct,
    });
  }

  return months;
}

export function calculateBreakEven(jobs: Job[], config: Config) {
  const validJobs = jobs.filter(j => j.netto_umsatz && j.netto_umsatz > 0);
  const avgUmsatz = validJobs.length > 0
    ? validJobs.reduce((s, j) => s + (j.netto_umsatz || 0), 0) / validJobs.length
    : 0;
  const avgRohertrag = validJobs.length > 0
    ? validJobs.reduce((s, j) => s + (j.rohertrag || 0), 0) / validJobs.length
    : 0;

  const operativerErtragProAuftrag = avgRohertrag * config.operative_marge_pct;
  const operativerErtragProMonat = operativerErtragProAuftrag * config.avg_auftraege_monat;

  const laufendeKosten = config.pflegekosten_monat + config.google_ads_budget;
  const ueberdeckung = operativerErtragProMonat - laufendeKosten;

  const einmalig = config.homepage_kosten + config.ads_setup_kosten;
  const monateBreakEven = ueberdeckung > 0 ? Math.ceil(einmalig / ueberdeckung) : Infinity;

  const startDate = new Date();
  const breakEvenDate = new Date(startDate);
  breakEvenDate.setMonth(breakEvenDate.getMonth() + monateBreakEven);

  return {
    avgUmsatzProAuftrag: avgUmsatz,
    operativeMargePct: config.operative_marge_pct,
    operativerErtragProAuftrag,
    avgAuftraegeProMonat: config.avg_auftraege_monat,
    operativerErtragProMonat,
    laufendeKostenProMonat: laufendeKosten,
    ueberdeckungProMonat: ueberdeckung,
    offeneInvestition: einmalig,
    monateBreakEven,
    breakEvenDatum: breakEvenDate,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "percent",
    minimumFractionDigits: 1,
  }).format(value / 100);
}
