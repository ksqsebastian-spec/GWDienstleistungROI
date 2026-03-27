"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Job, Config } from "@/lib/types";
import * as XLSX from "xlsx";
import { CHANNELS, TIER_LABELS, TIER_COLORS, formatEuro, Channel } from "@/lib/flywheel-data";
import BestPractices from "@/components/BestPractices";
import ExportButton from "@/components/ExportButton";

export default function FlywheelPage() {
  const [channels, setChannels] = useState<Channel[]>(
    CHANNELS.map((c) => ({ ...c }))
  );
  const [profit, setProfit] = useState(8000);
  const [calendlyOn, setCalendlyOn] = useState(true);
  const [loadedFromDB, setLoadedFromDB] = useState(false);

  // Load operative Marge from DB as default profit
  useEffect(() => {
    async function loadData() {
      const [jobsRes, configRes] = await Promise.all([
        supabase.from("jobs").select("rohertrag"),
        supabase.from("config").select("operative_marge_pct").limit(1).single(),
      ]);
      const jobs = (jobsRes.data || []) as { rohertrag: number | null }[];
      const config = configRes.data as { operative_marge_pct: number } | null;
      if (config && jobs.length > 0) {
        const totalRohertrag = jobs.reduce((s, j) => s + (j.rohertrag || 0), 0);
        const monthlyMarge = totalRohertrag * config.operative_marge_pct;
        if (monthlyMarge > 0) setProfit(Math.round(monthlyMarge));
      }
      setLoadedFromDB(true);
    }
    loadData();
  }, []);

  const scalable = useMemo(
    () => channels.filter((c) => !c.fix),
    [channels]
  );
  const totalPct = useMemo(
    () => scalable.reduce((s, c) => s + c.p, 0),
    [scalable]
  );
  const fixAmt = calendlyOn ? 12 : 0;
  const totalInvest = profit * totalPct / 100 + fixAmt;
  const activeChannels = channels.filter(
    (c) => (!c.fix && c.p > 0) || (c.fix && calendlyOn)
  );

  const updateChannel = useCallback((id: string, pct: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, p: pct } : c))
    );
  }, []);

  const scaleAll = useCallback(
    (targetPct: number) => {
      const currentTotal = scalable.reduce((s, c) => s + c.p, 0) || 1;
      setChannels((prev) =>
        prev.map((c) => {
          if (c.fix) return c;
          return { ...c, p: Math.round((c.p / currentTotal) * targetPct * 10) / 10 };
        })
      );
    },
    [scalable]
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <span className="inline-block px-3 py-1 bg-accent-light text-accent text-[10px] font-mono uppercase tracking-wider rounded-full mb-3">
            Profit-gestütztes Marketing
          </span>
          <h2 className="text-3xl font-semibold text-text mb-2">
            Das <span className="text-accent italic">Flywheel</span>
          </h2>
          <p className="text-sm text-text-muted max-w-xl">
            Gewinn aus Werbekunden wird anteilig in Kanäle reinvestiert, die den
            Gesamtertrag steigern.
          </p>
          {loadedFromDB && (
            <p className="text-[10px] font-mono text-text-dim mt-2">
              Gewinn vorbelegt aus ROI-Rechnung (editierbar)
            </p>
          )}
        </div>
        <ExportButton onClick={() => {
          const wb = XLSX.utils.book_new();

          // Sheet 1: Channel allocation
          const channelRows = channels
            .filter((c) => (!c.fix && c.p > 0) || (c.fix && calendlyOn))
            .sort((a, b) => b.p - a.p)
            .map((c) => ({
              Kanal: c.nm,
              "Tier": c.t,
              "Anteil (%)": c.fix ? "fix" : c.p,
              "Betrag (€/Monat)": c.fix ? c.fix : Math.round(profit * c.p / 100),
              Beschreibung: c.d,
              "Flywheel-Schleife": c.l,
            }));
          channelRows.push({
            Kanal: "GESAMT REINVESTIERT",
            "Tier": "" as unknown as number,
            "Anteil (%)": Math.round(totalPct) as unknown as string,
            "Betrag (€/Monat)": Math.round(totalInvest),
            Beschreibung: "",
            "Flywheel-Schleife": "",
          });
          channelRows.push({
            Kanal: "KUNDE BEHÄLT",
            "Tier": "" as unknown as number,
            "Anteil (%)": Math.round(100 - totalPct) as unknown as string,
            "Betrag (€/Monat)": Math.round(profit - totalInvest),
            Beschreibung: "",
            "Flywheel-Schleife": "",
          });
          const wsChannels = XLSX.utils.json_to_sheet(channelRows);
          wsChannels["!cols"] = [{ wch: 28 }, { wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 50 }, { wch: 40 }];
          XLSX.utils.book_append_sheet(wb, wsChannels, "Kanalverteilung");

          // Sheet 2: Summary
          const summaryRows = [
            { Kennzahl: "Monatlicher Gewinn", Wert: profit, Einheit: "€" },
            { Kennzahl: "Reinvestitions-Anteil", Wert: Math.round(totalPct), Einheit: "%" },
            { Kennzahl: "Reinvestiert", Wert: Math.round(totalInvest), Einheit: "€" },
            { Kennzahl: "Kunde behält", Wert: Math.round(profit - totalInvest), Einheit: "€" },
            { Kennzahl: "Aktive Kanäle", Wert: activeChannels.length, Einheit: "" },
          ];
          const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
          wsSummary["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 6 }];
          XLSX.utils.book_append_sheet(wb, wsSummary, "Zusammenfassung");

          XLSX.writeFile(wb, `GW-Flywheel_${new Date().toISOString().slice(0, 10)}.xlsx`);
        }}>
          Export
        </ExportButton>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-text-dim mb-2">
            Monatlicher Gewinn aus Werbekunden
          </label>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl text-text-dim">€</span>
            <input
              type="number"
              value={profit}
              onChange={(e) => setProfit(Math.max(0, parseInt(e.target.value) || 0))}
              className="text-2xl font-semibold text-accent bg-transparent border-b-2 border-surface-3 focus:border-accent outline-none w-40"
              step={100}
            />
          </div>
          <p className="text-[11px] text-text-dim font-mono">
            Reingewinn nach allen Kosten
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-text-dim mb-2">
            Reinvestitions-Anteil
          </label>
          <p className="text-2xl font-semibold text-red mb-3">
            {Math.round(totalPct)}%
          </p>
          <input
            type="range"
            min={5}
            max={70}
            step={1}
            value={Math.round(totalPct)}
            onChange={(e) => scaleAll(parseInt(e.target.value))}
            className="w-full accent-red"
          />
          <p className="text-[11px] text-text-dim font-mono mt-2">
            Alle Kanäle proportional skalieren
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-red" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
            Reinvestiert
          </p>
          <p className="text-2xl font-semibold text-red">{formatEuro(totalInvest)}</p>
          <p className="text-[11px] font-mono text-text-dim">
            {Math.round(totalPct)}%{calendlyOn ? " + €12 fix" : ""}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
            Kunde behält
          </p>
          <p className="text-2xl font-semibold text-accent">
            {formatEuro(profit - totalInvest)}
          </p>
          <p className="text-[11px] font-mono text-text-dim">Rest des Gewinns</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
            Aktive Kanäle
          </p>
          <p className="text-2xl font-semibold text-blue">{activeChannels.length}</p>
          <p className="text-[11px] font-mono text-text-dim">Schleifen</p>
        </div>
      </div>

      {/* Split Visualization */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h3 className="text-sm font-semibold mb-4">Gewinnverteilung</h3>
        {/* Bar */}
        <div className="flex h-11 rounded-lg overflow-hidden mb-2">
          {scalable
            .filter((c) => c.p > 0)
            .sort((a, b) => b.p - a.p)
            .map((c) => (
              <div
                key={c.id}
                style={{
                  flex: c.p,
                  backgroundColor: c.co,
                  opacity: 0.85,
                }}
                title={`${c.nm}: ${Math.round(c.p * 10) / 10}%`}
              />
            ))}
          <div
            className="bg-surface-3 flex items-center justify-center text-xs font-mono text-text-muted font-medium"
            style={{ flex: Math.max(100 - totalPct, 1) }}
          >
            {100 - totalPct >= 6 ? `${Math.round(100 - totalPct)}%` : ""}
          </div>
        </div>
        <div className="flex justify-between mb-5">
          <span className="text-[11px] font-mono text-red font-medium">
            Reinvestition — {formatEuro(totalInvest)}
          </span>
          <span className="text-[11px] font-mono text-accent font-medium">
            Kunde — {formatEuro(profit - totalInvest)}
          </span>
        </div>
        {/* Channel bars */}
        <div className="flex flex-col gap-1.5">
          {scalable
            .filter((c) => c.p > 0)
            .sort((a, b) => b.p - a.p)
            .map((c) => {
              const amount = profit * c.p / 100;
              const maxP = scalable.reduce((m, x) => Math.max(m, x.p), 1);
              const width = Math.max(4, (c.p / maxP) * 100);
              return (
                <div key={c.id} className="flex items-center gap-2.5">
                  <span className="text-xs min-w-[170px] text-right text-text-muted truncate">
                    {c.nm}
                  </span>
                  <div className="flex-1 h-[22px] bg-surface-2 rounded overflow-hidden">
                    <div
                      className="h-full rounded flex items-center pl-2"
                      style={{
                        width: `${width}%`,
                        backgroundColor: c.co,
                      }}
                    >
                      {width > 25 && (
                        <span className="text-[10px] font-mono text-white font-medium whitespace-nowrap">
                          {formatEuro(amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-mono font-medium min-w-[55px]"
                    style={{ color: c.co }}
                  >
                    {width <= 25 ? formatEuro(amount) : ""}{" "}
                    {Math.round(c.p * 10) / 10}%
                  </span>
                </div>
              );
            })}
          {calendlyOn && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs min-w-[170px] text-right text-text-muted">
                Calendly (fix)
              </span>
              <div className="flex-1 h-[22px] bg-surface-2 rounded overflow-hidden">
                <div
                  className="h-full rounded"
                  style={{ width: "6%", backgroundColor: "#0B6E4F" }}
                />
              </div>
              <span className="text-[11px] font-mono font-medium min-w-[55px] text-[#0B6E4F]">
                €12 fix
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Channel Cards by Tier */}
      {[1, 2, 3].map((tier) => {
        const tierChannels = channels.filter((c) => c.t === tier);
        const colors = TIER_COLORS[tier];
        return (
          <div key={tier}>
            <div className="flex items-center gap-2.5 my-5">
              <span
                className="text-[10px] font-mono uppercase tracking-wider font-medium px-3.5 py-1 rounded-full"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {TIER_LABELS[tier]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-1.5">
              {tierChannels.map((c) => {
                const isFixed = !!c.fix;
                const amount = isFixed ? (calendlyOn ? c.fix! : 0) : profit * c.p / 100;
                return (
                  <div
                    key={c.id}
                    className="bg-surface border border-border rounded-xl p-5 transition-all hover:border-border-hover hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: c.cl, color: c.co }}
                      >
                        ●
                      </div>
                      <div className="text-right">
                        {isFixed ? (
                          <>
                            <p
                              className="text-lg font-semibold"
                              style={{ color: calendlyOn ? c.co : "#9B9790" }}
                            >
                              €{c.fix}
                            </p>
                            <p className="text-[10px] font-mono text-text-dim">
                              {calendlyOn ? "aktiv" : "inaktiv"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p
                              className="text-lg font-semibold font-mono"
                              style={{ color: c.co }}
                            >
                              {formatEuro(amount)}
                            </p>
                            <p className="text-[10px] font-mono text-text-dim">
                              / Monat
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold mb-0.5">{c.nm}</p>
                    <p className="text-[11px] text-text-muted leading-relaxed mb-2.5">
                      {c.d}
                    </p>
                    <div
                      className="text-[10px] font-mono text-text-muted p-2.5 bg-surface-2 rounded-md leading-snug mb-3 border-l-2"
                      style={{ borderColor: c.co }}
                    >
                      ↻ {c.l}
                    </div>
                    {isFixed ? (
                      <div className="flex items-center gap-2.5 mt-1">
                        <button
                          onClick={() => setCalendlyOn(!calendlyOn)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            calendlyOn ? "bg-accent" : "bg-surface-3"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              calendlyOn ? "translate-x-4" : ""
                            }`}
                          />
                        </button>
                        <span className="text-[11px] font-mono text-text-muted">
                          {calendlyOn ? "Aktiv — €12/Mo." : "Deaktiviert"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <input
                          type="range"
                          min={0}
                          max={15}
                          step={0.5}
                          value={c.p}
                          onChange={(e) =>
                            updateChannel(c.id, parseFloat(e.target.value))
                          }
                          className="flex-1"
                          style={{ accentColor: c.co }}
                        />
                        <span
                          className="text-xs font-mono font-medium min-w-[36px] text-right"
                          style={{ color: c.co }}
                        >
                          {c.p}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Compound Loops */}
      <div className="bg-surface border border-border rounded-xl p-6 mt-6">
        <h3 className="text-base font-semibold mb-1">Compound-Schleifen</h3>
        <p className="text-xs text-text-muted mb-4">
          Jeder Kanal füttert die anderen
        </p>
        <div className="grid grid-cols-2 gap-2">
          {activeChannels.map((c) => (
            <div
              key={c.id}
              className="flex gap-2 items-start p-2.5 bg-surface-2 rounded-lg text-[11px] leading-relaxed text-text-muted"
            >
              <span className="shrink-0 mt-px" style={{ color: c.co }}>
                ●
              </span>
              <div>
                <strong className="text-text font-medium">{c.nm}</strong> —{" "}
                {c.cp}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <BestPractices />
    </div>
  );
}
