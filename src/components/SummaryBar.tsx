"use client";

import { Job } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import Tooltip from "@/components/Tooltip";

interface SummaryBarProps {
  jobs: Job[];
}

export default function SummaryBar({ jobs }: SummaryBarProps) {
  const now = new Date();
  const currentMonth = now.toLocaleString("de-DE", { month: "long" });
  const currentYear = now.getFullYear();

  const currentMonthJobs = jobs.filter(
    (j) => j.monat === currentMonth && j.jahr === currentYear
  );
  // If no jobs match current month, show all jobs
  const relevantJobs = currentMonthJobs.length > 0 ? currentMonthJobs : jobs;
  const label = currentMonthJobs.length > 0 ? `${currentMonth} ${currentYear}` : "Gesamt";

  const totalUmsatz = relevantJobs.reduce((s, j) => s + (j.netto_umsatz || 0), 0);
  const totalRohertrag = relevantJobs.reduce((s, j) => s + (j.rohertrag || 0), 0);
  const incomplete = jobs.filter((j) => j.netto_umsatz === null || j.rohertrag === null).length;

  const stats = [
    {
      label: `Netto-Umsatz (${label})`,
      tooltip: "Gesamter Rechnungsbetrag ohne Mehrwertsteuer.",
      value: formatCurrency(totalUmsatz),
      color: "text-accent",
      bar: "bg-accent",
    },
    {
      label: `Rohertrag (${label})`,
      tooltip: "Umsatz abzüglich direkter Kosten (Material, Fremdleistungen). Noch vor Gemeinkosten wie Miete oder Gehälter.",
      value: formatCurrency(totalRohertrag),
      color: "text-blue",
      bar: "bg-blue",
    },
    {
      label: "Aufträge",
      tooltip: "Anzahl der erfassten Aufträge im ausgewählten Zeitraum.",
      value: String(relevantJobs.length),
      color: "text-text",
      bar: "bg-text",
    },
    {
      label: "Unvollständig",
      tooltip: "Aufträge bei denen Netto-Umsatz oder Rohertrag noch fehlt (als ??? markiert).",
      value: String(incomplete),
      color: incomplete > 0 ? "text-amber" : "text-accent",
      bar: incomplete > 0 ? "bg-amber" : "bg-accent",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden"
        >
          <div className={`absolute top-0 left-0 right-0 h-[3px] ${s.bar}`} />
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-1">
            <Tooltip text={s.tooltip}>{s.label}</Tooltip>
          </p>
          <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
