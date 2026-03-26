"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Job } from "@/lib/types";
import SummaryBar from "@/components/SummaryBar";
import JobGrid from "@/components/JobGrid";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("datum", { ascending: false })
      .order("created_at", { ascending: false });
    setJobs((data as Job[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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

      <SummaryBar jobs={filteredJobs} />
      <JobGrid jobs={filteredJobs} onUpdate={fetchJobs} />
    </div>
  );
}
