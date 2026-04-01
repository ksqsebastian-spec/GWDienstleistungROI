"use client";

import * as XLSX from "xlsx";
import { CartItem, Channel, CHANNELS, formatEuro } from "@/lib/flywheel-data";

interface ReceiptProps {
  cart: CartItem[];
  totalBudget: number;
}

function getChannel(id: string): Channel | undefined {
  return CHANNELS.find((c) => c.id === id);
}

export default function Receipt({ cart, totalBudget }: ReceiptProps) {
  const recurring = cart.filter((i) => i.pricing === "recurring");
  const onetime = cart.filter((i) => i.pricing === "onetime");
  const recurringTotal = recurring.reduce((s, i) => s + i.amount, 0);
  const onetimeTotal = onetime.reduce((s, i) => s + i.amount, 0);
  const totalSpend = recurringTotal + onetimeTotal;
  const remaining = totalBudget - totalSpend;

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    const receiptRows = [
      ...recurring.map((i) => ({
        Position: getChannel(i.channelId)?.nm || i.channelId,
        Typ: "Monatlich",
        "Betrag (€)": i.amount,
      })),
      { Position: "", Typ: "", "Betrag (€)": "" },
      { Position: "ZWISCHENSUMME MONATLICH", Typ: "", "Betrag (€)": recurringTotal },
      { Position: "", Typ: "", "Betrag (€)": "" },
      ...onetime.map((i) => ({
        Position: getChannel(i.channelId)?.nm || i.channelId,
        Typ: "Einmalig",
        "Betrag (€)": i.amount,
      })),
      { Position: "", Typ: "", "Betrag (€)": "" },
      { Position: "ZWISCHENSUMME EINMALIG", Typ: "", "Betrag (€)": onetimeTotal },
      { Position: "", Typ: "", "Betrag (€)": "" },
      { Position: "GESAMTAUSGABEN", Typ: "", "Betrag (€)": totalSpend },
      { Position: "VERFÜGBARES BUDGET", Typ: "", "Betrag (€)": totalBudget },
      { Position: "VERBLEIBENDES BUDGET", Typ: "", "Betrag (€)": remaining },
    ];

    const ws = XLSX.utils.json_to_sheet(receiptRows);
    ws["!cols"] = [{ wch: 36 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "Beleg");
    XLSX.writeFile(wb, `GW-Marketing-Beleg_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (cart.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-sm text-text-dim font-mono">
          Warenkorb ist leer — füge Marketing-Maßnahmen hinzu
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border-2 border-accent/20 rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-accent-light/30 border-b border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text">Marketing-Beleg</h3>
            <p className="text-[10px] font-mono text-text-dim mt-0.5">
              {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={handleExport}
            className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            XLSX
          </button>
        </div>
      </div>

      {/* Recurring items */}
      {recurring.length > 0 && (
        <div className="border-b border-border/50">
          <div className="px-6 py-2 bg-surface-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
              Monatlich wiederkehrend
            </span>
          </div>
          {recurring.map((item) => {
            const ch = getChannel(item.channelId);
            return (
              <div key={item.channelId} className="px-6 py-2.5 flex justify-between items-center border-b border-border/30 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ch?.co }} />
                  <span className="text-xs text-text">{ch?.nm}</span>
                </div>
                <span className="text-xs font-mono text-text-muted">{formatEuro(item.amount)}/Mo.</span>
              </div>
            );
          })}
        </div>
      )}

      {/* One-time items */}
      {onetime.length > 0 && (
        <div className="border-b border-border/50">
          <div className="px-6 py-2 bg-surface-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
              Einmalige Investitionen
            </span>
          </div>
          {onetime.map((item) => {
            const ch = getChannel(item.channelId);
            return (
              <div key={item.channelId} className="px-6 py-2.5 flex justify-between items-center border-b border-border/30 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ch?.co }} />
                  <span className="text-xs text-text">{ch?.nm}</span>
                </div>
                <span className="text-xs font-mono text-text-muted">{formatEuro(item.amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Totals */}
      <div className="px-6 py-4 space-y-2">
        {recurring.length > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Monatlich gesamt</span>
            <span className="font-mono font-medium text-red">{formatEuro(recurringTotal)}/Mo.</span>
          </div>
        )}
        {onetime.length > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Einmalig gesamt</span>
            <span className="font-mono font-medium text-red">{formatEuro(onetimeTotal)}</span>
          </div>
        )}
        <div className="pt-2 border-t border-border flex justify-between text-xs">
          <span className="text-text-muted">Verfügbares Budget</span>
          <span className="font-mono text-text-dim">{formatEuro(totalBudget)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span>Verbleibend</span>
          <span className={`font-mono ${remaining >= 0 ? "text-accent" : "text-red"}`}>
            {formatEuro(remaining)}
          </span>
        </div>
        {remaining < 0 && (
          <p className="text-[10px] font-mono text-red mt-1">
            Budget überschritten um {formatEuro(Math.abs(remaining))}
          </p>
        )}
      </div>
    </div>
  );
}
