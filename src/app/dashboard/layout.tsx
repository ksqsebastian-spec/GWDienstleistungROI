"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Config, Purchase } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Aufträge" },
  { href: "/dashboard/roi", label: "ROI-Rechnung" },
  { href: "/dashboard/flywheel", label: "Flywheel" },
  { href: "/dashboard/ausgaben", label: "Ausgaben" },
  { href: "/dashboard/bestpractices", label: "Best Practice" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [budget, setBudget] = useState<{ total: number; spent: number } | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      router.push("/");
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  const loadBudget = useCallback(async () => {
    const [jobsRes, configRes, purchasesRes] = await Promise.all([
      supabase.from("jobs").select("rohertrag"),
      supabase.from("config").select("operative_marge_pct").limit(1).single(),
      supabase.from("purchases").select("amount,pricing"),
    ]);
    const jobs = (jobsRes.data || []) as { rohertrag: number | null }[];
    const config = configRes.data as { operative_marge_pct: number } | null;
    const purchases = (purchasesRes.data || []) as Pick<Purchase, "amount" | "pricing">[];

    const totalRohertrag = jobs.reduce((s, j) => s + (j.rohertrag || 0), 0);
    const total = config ? Math.round(totalRohertrag * config.operative_marge_pct) : 0;
    const spent = purchases.reduce((s, p) => s + Number(p.amount), 0);
    setBudget({ total, spent });
  }, []);

  useEffect(() => {
    if (authenticated) loadBudget();
  }, [authenticated, loadBudget, pathname]);

  if (!authenticated) return null;

  const remaining = budget ? budget.total - budget.spent : 0;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono uppercase tracking-wider text-accent bg-accent-light px-3 py-1 rounded-full">
              GW Dienstleistung
            </span>
            <h1 className="text-lg font-semibold text-text">ROI Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Budget pill */}
            {budget && (
              <div className="flex items-center gap-3 bg-surface-2 border border-border rounded-full px-4 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-text-dim">Budget</span>
                  <span className="text-xs font-mono font-semibold text-accent">
                    {"\u20AC"}{Math.round(remaining).toLocaleString("de-DE")}
                  </span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-text-dim">Ausgaben</span>
                  <span className="text-xs font-mono font-medium text-red">
                    {"\u20AC"}{Math.round(budget.spent).toLocaleString("de-DE")}
                  </span>
                </div>
              </div>
            )}
            <nav className="flex gap-1 bg-surface-2 border border-border rounded-full p-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-mono transition-all ${
                      isActive
                        ? "bg-text text-surface-2"
                        : "text-text-muted hover:bg-surface"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
