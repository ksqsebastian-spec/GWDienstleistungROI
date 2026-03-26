"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Aufträge" },
  { href: "/dashboard/roi", label: "ROI-Rechnung" },
  { href: "/dashboard/flywheel", label: "Flywheel" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      router.push("/");
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono uppercase tracking-wider text-accent bg-accent-light px-3 py-1 rounded-full">
              GW Dienstleistung
            </span>
            <h1 className="text-lg font-semibold text-text">ROI Dashboard</h1>
          </div>
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
                  className={`px-5 py-2 rounded-full text-xs font-mono transition-all ${
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
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
