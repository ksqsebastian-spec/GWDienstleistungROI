export interface Channel {
  id: string;
  nm: string;
  ic: string;
  p: number;
  co: string;
  cl: string;
  t: number;
  d: string;
  l: string;
  cp: string;
  fix?: number;
  rc?: number;
  pricing: "recurring" | "onetime";
  minCost: number;
  maxCost: number;
  defaultCost: number;
}

export interface CartItem {
  channelId: string;
  amount: number;
  pricing: "recurring" | "onetime";
}

export const CHANNELS: Channel[] = [
  // T1 — Recurring
  { id: "guarantee", nm: "Garantie-Fonds", ic: "g", p: 5, co: "#2D6A4F", cl: "#D8F3DC", t: 1, d: "Unwiderstehliche Garantie — Rückgabequote < 5%, Conversion +20–40%.", l: "Stärkere Garantie → weniger Risiko → mehr Abschlüsse", cp: "Hormozis #1 Conversion-Hebel.", pricing: "recurring", minCost: 50, maxCost: 500, defaultCost: 150 },
  { id: "speed", nm: "Speed / VIP-Reaktion", ic: "s", p: 5, co: "#C1440E", cl: "#FDECE5", t: 1, d: "Sofort-Reaktion, Auto-SMS, Follow-up-Emails, Erinnerungen. 21x höhere Kontaktrate bei 5 Min.", l: "Schneller reagieren + automatisch nachfassen → höhere Close-Rate", cp: "78% kaufen beim Erstreagierer.", pricing: "recurring", minCost: 50, maxCost: 300, defaultCost: 100 },
  { id: "reviews", nm: "Google Bewertungen", ic: "r", p: 4, co: "#1B4965", cl: "#E3EFF6", t: 1, rc: 5, d: "€5/Bewertung — NFC-Karten, Follow-ups, Incentives. Senkt CPC messbar.", l: "Höhere Sterne → bessere CTR → niedrigerer CPC", cp: "Quality Score steigt, Klickpreise sinken.", pricing: "recurring", minCost: 20, maxCost: 200, defaultCost: 80 },
  { id: "booking", nm: "Terminbuchung (Calendly)", ic: "c", p: 0, co: "#0B6E4F", cl: "#E0F5ED", t: 1, fix: 12, d: "€12/Monat fix — Erinnerungen rettet 15–30% verlorene Buchungen.", l: "Weniger No-Shows → mehr Umsatz/Lead", cp: "Jeder No-Show = verbranntes Budget.", pricing: "recurring", minCost: 12, maxCost: 12, defaultCost: 12 },
  { id: "whatsapp", nm: "WhatsApp Automation", ic: "wa2", p: 3, co: "#25D366", cl: "#E8F8ED", t: 1, d: "Automatisierte WhatsApp-Nachrichten: Terminbestätigung, Follow-up, Bewertungslink. 98% Öffnungsrate.", l: "Direkter Kanal → schnellere Reaktion → höhere Conversion", cp: "98% Öffnungsrate vs. 20% bei Email.", pricing: "recurring", minCost: 30, maxCost: 200, defaultCost: 80 },
  // T2
  { id: "lsa", nm: "Google LSA", ic: "ls", p: 3, co: "#1B4965", cl: "#E3EFF6", t: 2, d: "Pay-per-Lead statt Pay-per-Click. Google-Garantie-Badge. €15–30/Lead.", l: "Qualifiziertere Leads → bessere Conversion", cp: "Nur zahlen wenn jemand anruft.", pricing: "recurring", minCost: 100, maxCost: 2000, defaultCost: 500 },
  { id: "flyer", nm: "Flyer & Sticker System", ic: "fl", p: 2, co: "#B5651D", cl: "#FFF3E0", t: 2, d: "Design + Druck von Flyern/Aufklebern mit QR-Code. Haptisch, bleibt liegen.", l: "Physische Präsenz → Markenbekanntheit → Anfragen", cp: "Flyer am Kühlschrank bleibt Monate.", pricing: "onetime", minCost: 250, maxCost: 650, defaultCost: 350 },
  // T3
  { id: "vehicle", nm: "Fahrzeugbeschriftung", ic: "fz", p: 2, co: "#0B6E4F", cl: "#E0F5ED", t: 3, d: "Einmalig €800–2.000, dann null laufende Kosten. 30k–70k Sichtkontakte/Tag.", l: "Passive Sichtbarkeit → Suchanfragen", cp: "Null laufende Kosten nach Setup.", pricing: "onetime", minCost: 800, maxCost: 2000, defaultCost: 1200 },
  { id: "workwear", nm: "Arbeitskleidung", ic: "ak", p: 1, co: "#B5651D", cl: "#FFF3E0", t: 3, d: "Gebrandete Shirts, Jacken, Helme. Jeder Mitarbeiter = laufende Werbetafel.", l: "Professioneller Auftritt → Vertrauen → Suchanfragen", cp: "€20–50/Stück, null laufend.", pricing: "onetime", minCost: 200, maxCost: 500, defaultCost: 300 },
  { id: "signs", nm: "Baustellenschilder", ic: "bs", p: 1, co: "#1B4965", cl: "#E3EFF6", t: 3, d: '"Hier arbeitet [Firma]" + QR-Code. €30–80, wiederverwendbar.', l: "Nachbarschafts-Sichtbarkeit → lokale Anfragen", cp: "Höchster Social Proof: sichtbare Aktivität.", pricing: "onetime", minCost: 150, maxCost: 400, defaultCost: 250 },
  { id: "recruit", nm: "Recruiting Flyer", ic: "rc", p: 1, co: "#9B2335", cl: "#FCE8EC", t: 3, d: "Mitarbeiter-Gewinnung aus dem Flywheel. Flyer + QR zur Karriereseite.", l: "Mehr Mitarbeiter → mehr Kapazität → mehr Umsatz", cp: "Recruiting über Portale kostet €500–3k/Stelle.", pricing: "onetime", minCost: 150, maxCost: 400, defaultCost: 250 },
  { id: "handwritten", nm: "Handgeschriebene Karten", ic: "hw", p: 1, co: "#9B2335", cl: "#FCE8EC", t: 3, d: "~€3/Karte via Pensaki. Setup + erste Charge.", l: "Persönliche Geste → Bewertungen + Empfehlungen", cp: "Bewertungsrate 3–5x höher als Email.", pricing: "onetime", minCost: 50, maxCost: 200, defaultCost: 100 },
  { id: "warranty", nm: "Garantieverlängerung", ic: "wa", p: 1, co: "#2D6A4F", cl: "#D8F3DC", t: 3, d: "5 Jahre statt 1–2. Anwalt + Urkunden-Design. < 3% Inanspruchnahme.", l: "Stärkere Garantie → höhere Abschlussrate", cp: "Kostet fast nichts, wirkt enorm.", pricing: "onetime", minCost: 300, maxCost: 600, defaultCost: 400 },
  { id: "influencer", nm: "Influencer", ic: "in", p: 1, co: "#3730A3", cl: "#E8E7F8", t: 3, d: "Lokale Creator dokumentieren Zusammenarbeit. €50–150/Post.", l: "Sichtbarkeit → Social Proof → Anfragen", cp: "Content für eigene Ads zweitverwertbar. 5–11x ROI.", pricing: "recurring", minCost: 50, maxCost: 300, defaultCost: 100 },
];

export const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — Kern (80% Impact)",
  2: "Tier 2 — Wachstum (15%)",
  3: "Tier 3 — Compound & Branding (5%)",
};

export const TIER_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "#D8F3DC", text: "#2D6A4F" },
  2: { bg: "#FFF3E0", text: "#B5651D" },
  3: { bg: "#F0E6FA", text: "#5A189A" },
};

export function formatEuro(n: number): string {
  return "€" + Math.round(n).toLocaleString("de-DE");
}
