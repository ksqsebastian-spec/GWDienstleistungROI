"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Job, Config } from "@/lib/types";
import {
  calculateMonthlyROI,
  calculateBreakEven,
  formatCurrency,
  formatPercent,
} from "@/lib/calculations";
import Tooltip from "@/components/Tooltip";

function ConfigField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
        {label}
      </label>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="font-mono text-lg font-semibold text-text bg-transparent border-b-2 border-surface-3 focus:border-accent outline-none w-32 transition-colors"
        />
        {suffix && (
          <span className="text-sm text-text-dim font-mono">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function ROIPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [jobsRes, configRes] = await Promise.all([
      supabase.from("jobs").select("*").order("datum"),
      supabase.from("config").select("*").limit(1).single(),
    ]);
    setJobs((jobsRes.data as Job[]) || []);
    setConfig(configRes.data as Config);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateConfig = async (key: keyof Config, value: number) => {
    if (!config) return;
    const updated = { ...config, [key]: value };
    setConfig(updated);
    await supabase.from("config").update({ [key]: value }).eq("id", config.id);
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-dim font-mono text-sm">Laden...</div>
      </div>
    );
  }

  const monthlyData = calculateMonthlyROI(jobs, config);
  const breakEven = calculateBreakEven(jobs, config);
  const einmalig = config.homepage_kosten + config.ads_setup_kosten;
  const totals = monthlyData.reduce(
    (acc, m) => ({
      ads: acc.ads + m.google_ads_ausgaben,
      pflege: acc.pflege + m.pflegekosten,
      kosten: acc.kosten + m.kosten_gesamt,
      umsatz: acc.umsatz + m.netto_umsatz,
      rohertrag: acc.rohertrag + m.rohertrag,
      marge: acc.marge + m.operative_marge,
    }),
    { ads: 0, pflege: 0, kosten: 0, umsatz: 0, rohertrag: 0, marge: 0 }
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-text">
          <Tooltip text="Return on Investment — wie viel Gewinn die Investition in Google Ads und Homepage bisher zurückgebracht hat.">ROI</Tooltip>-Rechnung
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Google Ads & Homepage — automatisch berechnet
        </p>
      </div>

      {/* Config Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-dim mb-4">

            <Tooltip text="Kosten die nur einmal anfallen — Homepage-Erstellung und Google Ads Kampagnen-Setup.">Einmalige Investitionen</Tooltip>
          </h3>
          <div className="space-y-4">
            <ConfigField
              label="Homepage Erstellung"
              value={config.homepage_kosten}
              suffix="€"
              onChange={(v) => updateConfig("homepage_kosten", v)}
            />
            <ConfigField
              label="Google Ads Setup"
              value={config.ads_setup_kosten}
              suffix="€"
              onChange={(v) => updateConfig("ads_setup_kosten", v)}
            />
            <div className="pt-3 border-t border-border">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
                Summe
              </span>
              <p className="text-lg font-semibold text-red font-mono">
                {formatCurrency(einmalig)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-dim mb-4">

            <Tooltip text="Kosten die jeden Monat anfallen — Ads-Verwaltung und laufendes Werbebudget.">Laufende Kosten</Tooltip> (monatlich)
          </h3>
          <div className="space-y-4">
            <ConfigField
              label="Pflegekosten / Monat"
              value={config.pflegekosten_monat}
              suffix="€"
              onChange={(v) => updateConfig("pflegekosten_monat", v)}
            />
            <ConfigField
              label="Operative Marge (%)"
              value={config.operative_marge_pct * 100}
              suffix="%"
              onChange={(v) => updateConfig("operative_marge_pct", v / 100)}
            />
            <ConfigField
              label="Ø Aufträge / Monat"
              value={config.avg_auftraege_monat}
              onChange={(v) => updateConfig("avg_auftraege_monat", v)}
            />
          </div>
        </div>
      </div>

      {/* Monthly ROI Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text">Monatliche Übersicht</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {[
                  { label: "Monat", tip: "" },
                  { label: "Ads Ausg.", tip: "Monatliche Google Ads Werbeausgaben — das tatsächlich ausgegebene Klickbudget." },
                  { label: "Pflege", tip: "Monatliche Verwaltungsgebühr für die Betreuung der Google Ads Kampagnen." },
                  { label: "Kosten Ges.", tip: "Ads-Ausgaben + Pflegekosten zusammen für den Monat." },
                  { label: "Netto-Umsatz", tip: "Summe aller Rechnungsbeträge ohne MwSt. in diesem Monat." },
                  { label: "Rohertrag", tip: "Umsatz minus direkte Kosten (Material, Fremdleistungen)." },
                  { label: "Op. Marge", tip: "Operative Marge — der Anteil vom Rohertrag der als Gewinn bleibt (nach Gemeinkosten)." },
                  { label: "Ergebnis", tip: "Operative Marge minus laufende Kosten — der echte Monatsgewinn aus der Werbung." },
                  { label: "Kum. Kosten", tip: "Kumulierte Kosten — alle bisherigen Ausgaben aufsummiert (inkl. Anfangsinvestition)." },
                  { label: "Kum. Marge", tip: "Kumulierte operative Marge — gesamter bisheriger Gewinn aufsummiert." },
                  { label: "Kum. Ergebnis", tip: "Kumuliertes Ergebnis — Gesamtgewinn minus Gesamtkosten. Positiv = im Plus." },
                  { label: "ROI %", tip: "Return on Investment — Verhältnis von Gewinn zu Gesamtkosten in Prozent. 100% = doppelt zurück." },
                ].map((h) => (
                  <th
                    key={h.label}
                    className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium text-right first:text-left"
                  >
                    {h.tip ? <Tooltip text={h.tip}>{h.label}</Tooltip> : h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr
                  key={m.datum}
                  className="border-b border-border/50 hover:bg-surface-2/50"
                >
                  <td className="px-3 py-2.5 text-xs font-medium">{m.monat}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-right">
                    {formatCurrency(m.google_ads_ausgaben)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-right">
                    {formatCurrency(m.pflegekosten)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-right text-red">
                    {formatCurrency(m.kosten_gesamt)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-right">
                    {formatCurrency(m.netto_umsatz)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-right">
                    {formatCurrency(m.rohertrag)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-right text-accent">
                    {formatCurrency(m.operative_marge)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-xs font-mono text-right font-medium ${
                      m.gesamtergebnis >= 0 ? "text-accent" : "text-red"
                    }`}
                  >
                    {formatCurrency(m.gesamtergebnis)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-right text-text-dim">
                    {formatCurrency(m.kum_gesamtkosten)}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-right text-text-dim">
                    {formatCurrency(m.kum_operative_marge)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-xs font-mono text-right font-medium ${
                      m.kum_ergebnis >= 0 ? "text-accent" : "text-red"
                    }`}
                  >
                    {formatCurrency(m.kum_ergebnis)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-xs font-mono text-right ${
                      m.roi_pct >= 0 ? "text-accent" : "text-red"
                    }`}
                  >
                    {formatPercent(m.roi_pct)}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-surface-2 font-semibold">
                <td className="px-3 py-3 text-xs">GESAMT</td>
                <td className="px-3 py-3 text-xs font-mono text-right">
                  {formatCurrency(totals.ads)}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-right">
                  {formatCurrency(totals.pflege)}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-right text-red">
                  {formatCurrency(totals.kosten)}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-right">
                  {formatCurrency(totals.umsatz)}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-right">
                  {formatCurrency(totals.rohertrag)}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-right text-accent">
                  {formatCurrency(totals.marge)}
                </td>
                <td colSpan={5} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Break-Even Analysis */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-text mb-6"><Tooltip text="Der Punkt, ab dem die Einnahmen die gesamten Investitionskosten decken — ab hier ist das Projekt profitabel.">Break-Even</Tooltip> Analyse</h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-3">
              1. <Tooltip text="Der Gewinn pro Auftrag nach Abzug der direkten Kosten (Material, Arbeitszeit).">Operativer Ertrag</Tooltip> / Auftrag
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted"><Tooltip text="Durchschnittlicher Rechnungsbetrag pro Auftrag ohne Mehrwertsteuer.">Ø Netto-Umsatz</Tooltip> / Auftrag</span>
                <span className="font-mono">
                  {formatCurrency(breakEven.avgUmsatzProAuftrag)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted"><Tooltip text="Anteil des Rohertrags der als tatsächlicher Gewinn übrig bleibt — nach Gemeinkosten wie Miete, Versicherung, Verwaltung.">Operative Marge</Tooltip></span>
                <span className="font-mono">
                  {(breakEven.operativeMargePct * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1 border-t border-border">
                <span>Op. Ertrag / Auftrag</span>
                <span className="font-mono text-accent">
                  {formatCurrency(breakEven.operativerErtragProAuftrag)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Ø Aufträge / Monat</span>
                <span className="font-mono">
                  {breakEven.avgAuftraegeProMonat}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-3">
              2. Laufende Kosten / Monat
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Ø Google Ads / Monat</span>
                <span className="font-mono text-red">
                  {formatCurrency(87.75)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Pflegekosten / Monat</span>
                <span className="font-mono text-red">
                  {formatCurrency(config.pflegekosten_monat)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1 border-t border-border">
                <span>Laufende Kosten / Monat</span>
                <span className="font-mono text-red">
                  {formatCurrency(breakEven.laufendeKostenProMonat)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-3">
              3. <Tooltip text="Monatlicher Überschuss nach Abzug aller laufenden Kosten — wird zum Abbau der Anfangsinvestition genutzt.">Überdeckung</Tooltip> & Break-Even
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Ø Op. Ertrag / Monat</span>
                <span className="font-mono">
                  {formatCurrency(breakEven.operativerErtragProMonat)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">− Laufende Kosten</span>
                <span className="font-mono text-red">
                  {formatCurrency(breakEven.laufendeKostenProMonat)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-medium pt-1 border-t border-border">
                <span>Überdeckung / Monat</span>
                <span className="font-mono text-accent">
                  {formatCurrency(breakEven.ueberdeckungProMonat)}
                </span>
              </div>
              <div className="mt-4 p-4 bg-accent-light rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Offene Investition</span>
                  <span className="font-mono font-medium">
                    {formatCurrency(breakEven.offeneInvestition)}
                  </span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-muted">Monate bis Break-Even</span>
                  <span className="font-mono font-semibold text-accent">
                    {breakEven.monateBreakEven === Infinity
                      ? "—"
                      : breakEven.monateBreakEven}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Voraussichtlich</span>
                  <span className="font-mono font-semibold text-accent">
                    {breakEven.monateBreakEven === Infinity
                      ? "—"
                      : breakEven.breakEvenDatum.toLocaleDateString("de-DE", {
                          month: "long",
                          year: "numeric",
                        })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Break-Even Progress Bar */}
        {breakEven.monateBreakEven !== Infinity && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-text-dim mb-2">
              <span>Investition</span>
              <span>Break-Even</span>
            </div>
            <div className="h-3 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((einmalig - breakEven.offeneInvestition + (totals.marge - totals.kosten)) /
                      einmalig) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
