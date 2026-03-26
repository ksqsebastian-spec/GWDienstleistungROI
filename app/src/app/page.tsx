"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasscodePage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    const data = await res.json();

    if (data.valid) {
      sessionStorage.setItem("authenticated", "true");
      router.push("/dashboard");
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-border rounded-xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 bg-accent-light text-accent text-xs font-mono uppercase tracking-wider rounded-full mb-4">
              GW Dienstleistung
            </div>
            <h1 className="text-2xl font-semibold text-text mb-2">
              ROI Dashboard
            </h1>
            <p className="text-sm text-text-muted">
              Zugangs-Code eingeben
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              placeholder="Code eingeben..."
              className={`w-full px-4 py-3 rounded-lg border text-sm font-mono tracking-wider text-center transition-colors outline-none ${
                error
                  ? "border-red bg-red-light text-red"
                  : "border-border bg-surface-2 text-text focus:border-accent focus:bg-accent-light"
              }`}
              autoFocus
            />
            {error && (
              <p className="text-red text-xs text-center mt-2 font-mono">
                Falscher Code
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !passcode}
              className="w-full mt-4 py-3 bg-text text-surface rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "..." : "Zugang"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
