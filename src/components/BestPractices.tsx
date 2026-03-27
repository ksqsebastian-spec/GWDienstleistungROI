"use client";

import { useState } from "react";

interface BPItem {
  t: string;
  d: string;
}

interface BPCategory {
  c: string;
  icon: string;
  items: BPItem[];
}

const BP_CATEGORIES: BPCategory[] = [
  {
    c: "Google Business Profile",
    icon: "📍",
    items: [
      { t: "Auf jede Bewertung innerhalb 24h antworten", d: "Professionell, persönlich, nie generisch." },
      { t: "Wöchentlich Google-Beitrag veröffentlichen", d: "Projekte, Tipps — hält Profil aktiv." },
      { t: "Min. 20 aktuelle Fotos im Profil", d: "Projekte, Team, Werkstatt, Fahrzeuge." },
      { t: "Öffnungszeiten monatlich prüfen", d: "Falsche Zeiten = verlorene Kunden." },
      { t: "FAQ-Bereich aktiv pflegen", d: "Häufige Fragen proaktiv beantworten." },
    ],
  },
  {
    c: "Website",
    icon: "🌐",
    items: [
      { t: "Telefonnummer auf jeder Seite (Click-to-Call)", d: "Mobil muss ein Tipp reichen." },
      { t: "Mobile Ladezeit unter 3 Sekunden", d: "53% verlassen langsamere Seiten." },
      { t: "Referenzprojekte mit Fotos", d: "Min. 5 Projekte mit Vorher/Nachher." },
    ],
  },
  {
    c: "Ads & Tracking",
    icon: "📊",
    items: [
      { t: "Conversion-Tracking korrekt eingerichtet", d: "Ohne Tracking keine Optimierung." },
    ],
  },
  {
    c: "Kundenprozess",
    icon: "👤",
    items: [
      { t: "Lead-Reaktionszeit unter 15 Min.", d: "Messen und tracken." },
      { t: "Auto-Terminbestätigung per Email/SMS", d: "Reduziert No-Shows sofort." },
      { t: "Follow-up 48h nach Auftrag", d: "Danke + Bewertungslink." },
      { t: "Empfehlungsprogramm kommuniziert", d: "Visitenkarte, Signatur, Website." },
      { t: "Kundenzufriedenheit abfragen", d: "Skala 1–10 nach jedem Auftrag." },
    ],
  },
  {
    c: "WhatsApp Automation",
    icon: "💬",
    items: [
      { t: "WhatsApp Business Profil einrichten", d: "Firmenname, Logo, Öffnungszeiten, Adresse, Website-Link. Verifizierung starten." },
      { t: "Automatische Begrüßungsnachricht aktivieren", d: "Sofortige Reaktion bei Erstkontakt — zeigt Professionalität, fängt Leads auf." },
      { t: "Terminbestätigung per WhatsApp senden", d: "Automatisch nach Buchung: Datum, Uhrzeit, Adresse, Anfahrt. Öffnungsrate 98% vs. 20% Email." },
      { t: "Erinnerung 24h + 2h vor Termin", d: "Automatische WhatsApp-Erinnerung reduziert No-Shows um 30–50%. Persönlicher als SMS." },
      { t: "Follow-up nach Auftrag (48h)", d: "Automatische Nachricht: Danke + Bewertungslink + Empfehlungscode. Höchste Response-Rate aller Kanäle." },
      { t: "Angebotsversand per WhatsApp", d: "PDF-Angebot direkt per WhatsApp senden — wird sofort gesehen, nicht im Spam-Ordner." },
      { t: "Reaktivierung nach 6 Monaten", d: "Automatische Nachricht an Bestandskunden: Wartung, Saisonangebote, Empfehlungsprogramm." },
      { t: "Quick Replies / Schnellantworten einrichten", d: "Vorgefertigte Antworten für häufige Fragen: Preise, Verfügbarkeit, Ablauf. Spart 60% Antwortzeit." },
    ],
  },
];

export default function BestPractices() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const totalItems = BP_CATEGORIES.reduce((s, c) => s + c.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progressPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const toggle = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mt-10">
      <div className="mb-6">
        <span className="inline-block px-3 py-1 bg-accent-light text-accent text-[10px] font-mono uppercase tracking-wider rounded-full mb-3">
          Kostenlose Sofortmaßnahmen
        </span>
        <h2 className="text-2xl font-semibold text-text mb-2">
          Best Practice Checkliste
        </h2>
        <p className="text-sm text-text-muted">
          Maßnahmen die kein Budget brauchen.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-surface border border-border rounded-xl">
        <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-sm font-mono font-medium text-accent min-w-[50px] text-right">
          {checkedCount}/{totalItems}
        </span>
      </div>

      {/* Categories */}
      {BP_CATEGORIES.map((cat) => (
        <div key={cat.c} className="mb-6">
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <span>{cat.icon}</span>
            {cat.c}
          </h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {cat.items.map((item, i) => {
              const key = `${cat.c}-${i}`;
              const isChecked = !!checked[key];
              return (
                <div
                  key={key}
                  onClick={() => toggle(key)}
                  className={`flex items-start gap-3 px-5 py-3.5 border-b border-surface-3 last:border-b-0 cursor-pointer transition-colors ${
                    isChecked ? "bg-accent-light/40" : "hover:bg-surface-2"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isChecked
                        ? "bg-accent border-accent"
                        : "border-border"
                    }`}
                  >
                    {isChecked && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-[13px] font-medium transition-all ${
                        isChecked
                          ? "line-through text-text-dim"
                          : "text-text"
                      }`}
                    >
                      {item.t}
                    </p>
                    <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">
                      {item.d}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
