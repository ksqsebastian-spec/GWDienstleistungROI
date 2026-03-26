-- Run this in the Supabase SQL Editor to set up the database

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jahr INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  monat TEXT NOT NULL,
  kundenname TEXT DEFAULT '',
  objektadresse TEXT DEFAULT '',
  taetigkeit TEXT DEFAULT '',
  herkunft TEXT DEFAULT '',
  netto_umsatz NUMERIC,
  rohertrag NUMERIC,
  angebot TEXT DEFAULT '',
  datum DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config table (single row)
CREATE TABLE IF NOT EXISTS config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homepage_kosten NUMERIC NOT NULL DEFAULT 10000,
  ads_setup_kosten NUMERIC NOT NULL DEFAULT 2000,
  pflegekosten_monat NUMERIC NOT NULL DEFAULT 50,
  operative_marge_pct NUMERIC NOT NULL DEFAULT 0.20,
  avg_auftraege_monat NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO config (homepage_kosten, ads_setup_kosten, pflegekosten_monat, operative_marge_pct, avg_auftraege_monat)
VALUES (10000, 2000, 50, 0.20, 5);

-- Insert seed data from the xlsx
INSERT INTO jobs (jahr, monat, kundenname, objektadresse, taetigkeit, herkunft, netto_umsatz, rohertrag, angebot, datum) VALUES
  (2026, 'März', 'Familie Rabe', 'Claudiusstraße 13a', 'Fensterwartung', 'Fenster Dichtungprüfung', 165, 165, 'x', '2026-03-01'),
  (2026, 'März', 'NormanBau', 'Sengelmannstraße 95', 'Dichtungsprüfung', 'Fenster Dichtigkeitsprüfung', 148.75, 148.75, 'x', '2026-03-01'),
  (2026, 'März', 'Familie Schulz', 'Saseler Damm 70', 'Hebe-Schiebetür Reparatur', 'Fenster Reparatur', 1317.50, 842.50, 'Nr. 2627', '2026-03-01'),
  (2026, 'März', 'Herr Klages', 'Krausestraße 34', 'WE-Tür Tauschen', 'Tischlerei in der Nähe', NULL, NULL, 'Folgt', '2026-03-01'),
  (2026, 'März', 'Herr Heikler', 'Garstedter Weg 167', 'Fenster Abdichten + Scheibentauschen', 'Kontaktformular', NULL, NULL, 'Folgt', '2026-03-01');

-- Disable RLS for now (single client, passcode auth)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON jobs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON config FOR ALL USING (true) WITH CHECK (true);
