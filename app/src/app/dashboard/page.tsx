"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Job, Upload } from "@/lib/types";
import SummaryBar from "@/components/SummaryBar";
import JobGrid from "@/components/JobGrid";
import FileImport from "@/components/FileImport";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showImport, setShowImport] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("datum", { ascending: false })
      .order("created_at", { ascending: false });
    setJobs((data as Job[]) || []);
    setLoading(false);
  }, []);

  const fetchUploads = useCallback(async () => {
    const { data } = await supabase
      .from("uploads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setUploads((data as Upload[]) || []);
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchUploads();
  }, [fetchJobs, fetchUploads]);

  // Get unique herkunft values
  const herkunftValues = [...new Set(jobs.map((j) => j.herkunft).filter(Boolean))];
  const filteredJobs =
    filter === "all" ? jobs : jobs.filter((j) => j.herkunft === filter);

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
          <h2 className="text-xl font-semibold text-text">Aufträge</h2>
          <p className="text-sm text-text-muted mt-1">
            Google Ads Projekt — Auftragsliste
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImport(!showImport)}
            className={`text-xs font-mono px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showImport
                ? "bg-accent text-white border-accent"
                : "bg-surface text-text-muted border-border hover:border-accent hover:text-accent"
            }`}
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
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Import
          </button>
          <label className="text-[10px] font-mono uppercase tracking-wider text-text-dim">
            Herkunft
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs font-mono bg-surface border border-border rounded-lg px-3 py-2 text-text-muted outline-none focus:border-accent"
          >
            <option value="all">Alle</option>
            {herkunftValues.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Import Section */}
      {showImport && (
        <div className="mb-6">
          <FileImport
            onImportComplete={() => {
              fetchJobs();
              fetchUploads();
            }}
          />
          {/* Recent uploads */}
          {uploads.length > 0 && (
            <div className="mt-3 px-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-2">
                Letzte Importe
              </p>
              <div className="flex flex-wrap gap-2">
                {uploads.map((u) => (
                  <div
                    key={u.id}
                    className="text-[10px] font-mono text-text-dim bg-surface-2 border border-border rounded-lg px-3 py-1.5 flex items-center gap-2"
                  >
                    <span className="text-text font-medium">{u.filename}</span>
                    <span className="text-accent">{u.rows_imported} Zeilen</span>
                    <span>
                      {new Date(u.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <SummaryBar jobs={filteredJobs} />
      <JobGrid jobs={filteredJobs} onUpdate={fetchJobs} />
    </div>
  );
}
