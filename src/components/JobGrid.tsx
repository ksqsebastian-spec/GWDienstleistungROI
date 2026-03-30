"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Job, MONATE, HERKUNFT_OPTIONS } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/calculations";

interface JobGridProps {
  jobs: Job[];
  onUpdate: () => void;
}

const COLUMNS = [
  { key: "jahr", label: "Jahr", width: "w-16", type: "number" },
  { key: "monat", label: "Monat", width: "w-24", type: "select" },
  { key: "kundenname", label: "Kundenname", width: "w-40", type: "text" },
  { key: "objektadresse", label: "Objektadresse", width: "w-48", type: "text" },
  { key: "taetigkeit", label: "Tätigkeit", width: "w-44", type: "text" },
  { key: "herkunft", label: "Herkunft", width: "w-40", type: "herkunft" },
  { key: "netto_umsatz", label: "Netto-Umsatz", width: "w-28", type: "currency" },
  { key: "rohertrag", label: "Rohertrag", width: "w-28", type: "currency" },
  { key: "angebot", label: "Angebot", width: "w-24", type: "text" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

function EditableCell({
  value,
  type,
  onSave,
}: {
  value: string | number | null;
  type: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const isMissing =
    (type === "currency") && (value === null || value === undefined || value === "");

  if (type === "select") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onSave(e.target.value)}
        className="cell-input bg-transparent text-xs"
      >
        {MONATE.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    );
  }

  if (type === "herkunft") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onSave(e.target.value)}
        className="cell-input bg-transparent text-xs"
      >
        <option value="">—</option>
        {HERKUNFT_OPTIONS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    );
  }

  if (!editing) {
    return (
      <div
        onClick={() => {
          setDraft(String(value ?? ""));
          setEditing(true);
        }}
        className={`cursor-text text-xs min-h-[24px] flex items-center px-1 rounded ${
          isMissing ? "cell-missing px-2 py-1 rounded" : ""
        } ${type === "currency" ? "font-mono justify-end" : ""}`}
      >
        {isMissing
          ? "???"
          : type === "currency"
          ? formatCurrency(Number(value))
          : String(value ?? "")}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type === "currency" || type === "number" ? "number" : "text"}
      step={type === "currency" ? "0.01" : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft !== String(value ?? "")) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          setEditing(false);
          if (draft !== String(value ?? "")) onSave(draft);
        }
        if (e.key === "Escape") {
          setEditing(false);
          setDraft(String(value ?? ""));
        }
      }}
      className={`cell-input text-xs ${
        type === "currency" || type === "number" ? "cell-input-number" : ""
      }`}
    />
  );
}

export default function JobGrid({ jobs, onUpdate }: JobGridProps) {
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = useCallback(
    async (jobId: string, key: ColumnKey, rawValue: string) => {
      setSaving(jobId);
      let value: string | number | null = rawValue;

      if (key === "netto_umsatz" || key === "rohertrag") {
        value = rawValue === "" ? null : parseFloat(rawValue);
      } else if (key === "jahr") {
        value = parseInt(rawValue) || new Date().getFullYear();
      } else {
        // Truncate text fields to 500 chars max
        value = rawValue.slice(0, 500);
      }

      await supabase.from("jobs").update({ [key]: value }).eq("id", jobId);
      setSaving(null);
      onUpdate();
    },
    [onUpdate]
  );

  const handleAddRow = async () => {
    const now = new Date();
    await supabase.from("jobs").insert({
      jahr: now.getFullYear(),
      monat: MONATE[now.getMonth()],
      datum: now.toISOString().split("T")[0],
    });
    onUpdate();
  };

  const handleDelete = async (jobId: string) => {
    await supabase.from("jobs").delete().eq("id", jobId);
    onUpdate();
  };

  // Group by month
  const grouped = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = `${job.monat} ${job.jahr}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(job);
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-10 px-2" />
            </tr>
          </thead>
          {[...grouped.entries()].map(([monthLabel, monthJobs]) => {
              const monthUmsatz = monthJobs.reduce(
                (s, j) => s + (j.netto_umsatz || 0),
                0
              );
              const monthRohertrag = monthJobs.reduce(
                (s, j) => s + (j.rohertrag || 0),
                0
              );

              return (
                <tbody key={monthLabel}>
                  {/* Month header */}
                  <tr className="bg-surface-3">
                    <td
                      colSpan={COLUMNS.length + 1}
                      className="px-3 py-2 text-xs font-semibold text-text-muted"
                    >
                      {monthLabel}
                      <span className="ml-4 font-mono text-text-dim font-normal">
                        {monthJobs.length} Aufträge
                        {" · "}
                        Umsatz {formatCurrency(monthUmsatz)}
                        {" · "}
                        Rohertrag {formatCurrency(monthRohertrag)}
                      </span>
                    </td>
                  </tr>
                  {monthJobs.map((job) => (
                    <tr
                      key={job.id}
                      className={`border-b border-border/50 hover:bg-surface-2/50 transition-colors ${
                        saving === job.id ? "opacity-60" : ""
                      }`}
                    >
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={`px-3 py-2 ${col.width}`}>
                          <EditableCell
                            value={job[col.key as keyof Job] as string | number | null}
                            type={col.type}
                            onSave={(val) =>
                              handleSave(job.id, col.key, val)
                            }
                          />
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-text-dim hover:text-red text-xs transition-colors"
                          title="Löschen"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
        </table>
      </div>
      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={handleAddRow}
          className="text-xs font-mono text-accent hover:text-text transition-colors flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span> Neuen Auftrag hinzufügen
        </button>
      </div>
    </div>
  );
}
