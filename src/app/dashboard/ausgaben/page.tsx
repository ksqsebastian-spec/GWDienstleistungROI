"use client";

import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { Purchase } from "@/lib/types";
import { formatEuro } from "@/lib/flywheel-data";
import ExportButton from "@/components/ExportButton";

export default function AusgabenPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "recurring" | "onetime">("all");

  const fetchPurchases = useCallback(async () => {
    const { data } = await supabase
      .from("purchases")
      .select("*")
      .order("purchased_at", { ascending: false });
    setPurchases((data as Purchase[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleDelete = async (id: string) => {
    await supabase.from("purchases").delete().eq("id", id);
    fetchPurchases();
  };

  const filtered = filter === "all" ? purchases : purchases.filter((p) => p.pricing === filter);
  const totalSpent = purchases.reduce((s, p) => s + Number(p.amount), 0);
  const recurringTotal = purchases.filter((p) => p.pricing === "recurring").reduce((s, p) => s + Number(p.amount), 0);
  const onetimeTotal = purchases.filter((p) => p.pricing === "onetime").reduce((s, p) => s + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-dim font-mono text-sm">Laden...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text">Ausgaben</h2>
          <p className="text-sm text-text-muted mt-1">
            Marketing-Einkäufe aus dem Flywheel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            disabled={purchases.length === 0}
            onClick={() => {
              const rows = purchases.map((p) => ({
                Datum: new Date(p.purchased_at).toLocaleDateString("de-DE", {
                  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                }),
                Kanal: p.channel_name,
                Typ: p.pricing === "recurring" ? "Monatlich" : "Einmalig",
                "Betrag (€)": Number(p.amount),
                Notiz: p.note || "",
              }));
              rows.push({
                Datum: "",
                Kanal: "GESAMT",
                Typ: "",
                "Betrag (€)": totalSpent,
                Notiz: "",
              });
              const ws = XLSX.utils.json_to_sheet(rows);
              ws["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 30 }];
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Ausgaben");
              XLSX.writeFile(wb, `GW-Ausgaben_${new Date().toISOString().slice(0, 10)}.xlsx`);
            }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="text-xs font-mono bg-surface border border-border rounded-lg px-3 py-2 text-text-muted outline-none focus:border-accent"
          >
            <option value="all">Alle</option>
            <option value="recurring">Monatlich</option>
            <option value="onetime">Einmalig</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-red" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">Gesamt ausgegeben</p>
          <p className="text-2xl font-semibold text-red">{formatEuro(totalSpent)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">Monatlich</p>
          <p className="text-2xl font-semibold text-blue">{formatEuro(recurringTotal)}</p>
          <p className="text-[10px] font-mono text-text-dim mt-0.5">{purchases.filter((p) => p.pricing === "recurring").length} Positionen</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">Einmalig</p>
          <p className="text-2xl font-semibold text-amber">{formatEuro(onetimeTotal)}</p>
          <p className="text-[10px] font-mono text-text-dim mt-0.5">{purchases.filter((p) => p.pricing === "onetime").length} Positionen</p>
        </div>
      </div>

      {/* Purchase list */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-sm text-text-dim font-mono">Noch keine Ausgaben erfasst</p>
          <p className="text-xs text-text-dim mt-1">Kaufe Marketing-Maßnahmen im Flywheel-Tab</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium text-left">Datum</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium text-left">Kanal</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium text-left">Typ</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium text-right">Betrag</th>
                <th className="px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium text-left">Notiz</th>
                <th className="w-10 px-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-text-muted">
                    {new Date(p.purchased_at).toLocaleDateString("de-DE", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                    })}
                    <span className="text-text-dim ml-1.5">
                      {new Date(p.purchased_at).toLocaleTimeString("de-DE", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-text">{p.channel_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        p.pricing === "recurring"
                          ? "bg-blue-light text-blue"
                          : "bg-amber-light text-amber"
                      }`}
                    >
                      {p.pricing === "recurring" ? "monatlich" : "einmalig"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono font-medium text-right text-red">
                    {formatEuro(Number(p.amount))}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{p.note}</td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-text-dim hover:text-red text-xs transition-colors"
                      title="Löschen"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
