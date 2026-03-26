"use client";

import * as XLSX from "xlsx";
import { Job } from "@/lib/types";

interface ExportButtonProps {
  jobs: Job[];
}

export default function ExportButton({ jobs }: ExportButtonProps) {
  const handleExport = () => {
    const rows = jobs.map((j) => ({
      Jahr: j.jahr,
      Monat: j.monat,
      Kundenname: j.kundenname,
      Objektadresse: j.objektadresse,
      "Tätigkeit": j.taetigkeit,
      Herkunft: j.herkunft,
      "Netto-Umsatz": j.netto_umsatz,
      Rohertrag: j.rohertrag,
      Angebot: j.angebot,
      Datum: j.datum,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    ws["!cols"] = [
      { wch: 6 },  // Jahr
      { wch: 10 }, // Monat
      { wch: 20 }, // Kundenname
      { wch: 30 }, // Objektadresse
      { wch: 30 }, // Tätigkeit
      { wch: 25 }, // Herkunft
      { wch: 14 }, // Netto-Umsatz
      { wch: 14 }, // Rohertrag
      { wch: 12 }, // Angebot
      { wch: 12 }, // Datum
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aufträge");
    XLSX.writeFile(
      wb,
      `GW-Auftraege_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <button
      onClick={handleExport}
      disabled={jobs.length === 0}
      className="text-xs font-mono px-4 py-2 rounded-lg border bg-surface text-text-muted border-border hover:border-accent hover:text-accent transition-colors flex items-center gap-2 disabled:opacity-40"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
      Export
    </button>
  );
}
