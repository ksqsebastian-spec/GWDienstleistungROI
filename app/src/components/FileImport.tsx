"use client";

import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { IMPORTABLE_FIELDS, AUTO_COLUMN_MAP, MONATE } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

interface FileImportProps {
  onImportComplete: () => void;
}

type RawRow = Record<string, string | number | null>;

interface ParsedFile {
  filename: string;
  sheetName: string;
  headers: string[];
  rows: RawRow[];
  allSheets: string[];
}

type ColumnMapping = Record<string, string>; // fileHeader → dbField

function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    if (AUTO_COLUMN_MAP[normalized]) {
      mapping[header] = AUTO_COLUMN_MAP[normalized];
    }
  }
  return mapping;
}

function parseValue(
  raw: string | number | null | undefined,
  dbField: string
): string | number | null {
  if (raw === null || raw === undefined || raw === "") return null;

  const fieldDef = IMPORTABLE_FIELDS.find((f) => f.key === dbField);
  if (!fieldDef) return String(raw);

  if (fieldDef.type === "number") {
    // Handle "???" or non-numeric
    const str = String(raw).replace(/[€\s]/g, "").replace(",", ".");
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  if (fieldDef.type === "date") {
    // Handle Excel serial dates or date strings
    if (typeof raw === "number") {
      // Excel serial date
      const date = XLSX.SSF.parse_date_code(raw);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
      }
    }
    const str = String(raw).trim();
    // Try ISO format or common German formats
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const deMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (deMatch)
      return `${deMatch[3]}-${deMatch[2].padStart(2, "0")}-${deMatch[1].padStart(2, "0")}`;
    return null;
  }

  return String(raw).trim();
}

function isRowEmpty(row: RawRow, mapping: ColumnMapping): boolean {
  // A row is "empty" if all mapped fields are blank
  return Object.entries(mapping).every(([fileHeader]) => {
    const val = row[fileHeader];
    return val === null || val === undefined || String(val).trim() === "";
  });
}

export default function FileImport({ onImportComplete }: FileImportProps) {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setPreviewMode(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const allSheets = workbook.SheetNames;
        const firstSheet = allSheets[0];
        loadSheet(workbook, firstSheet, file.name, allSheets);
      } catch {
        setError("Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  function loadSheet(
    workbook: XLSX.WorkBook,
    sheetName: string,
    filename: string,
    allSheets: string[]
  ) {
    const ws = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null });
    if (json.length === 0) {
      setError(`Tabelle "${sheetName}" ist leer.`);
      return;
    }
    const headers = Object.keys(json[0]);
    const file: ParsedFile = {
      filename,
      sheetName,
      headers,
      rows: json,
      allSheets,
    };
    setParsed(file);
    setMapping(autoMapColumns(headers));
  }

  const updateMapping = (fileHeader: string, dbField: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (dbField === "") {
        delete next[fileHeader];
      } else {
        next[fileHeader] = dbField;
      }
      return next;
    });
  };

  const getMappedDbFields = () => new Set(Object.values(mapping));

  const getPreviewRows = () => {
    if (!parsed) return [];
    return parsed.rows
      .filter((row) => !isRowEmpty(row, mapping))
      .slice(0, 10)
      .map((row) => {
        const mapped: Record<string, string | number | null> = {};
        for (const [fileHeader, dbField] of Object.entries(mapping)) {
          mapped[dbField] = parseValue(row[fileHeader], dbField);
        }
        return mapped;
      });
  };

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setError(null);

    const nonEmptyRows = parsed.rows.filter(
      (row) => !isRowEmpty(row, mapping)
    );

    const jobsToInsert = nonEmptyRows.map((row) => {
      const job: Record<string, string | number | null> = {};
      for (const [fileHeader, dbField] of Object.entries(mapping)) {
        job[dbField] = parseValue(row[fileHeader], dbField);
      }

      // Ensure required fields have defaults
      if (!job.jahr)
        job.jahr = new Date().getFullYear();
      if (!job.monat) {
        const month = job.datum
          ? new Date(String(job.datum)).getMonth()
          : new Date().getMonth();
        job.monat = MONATE[month] || MONATE[0];
      }
      if (!job.datum) {
        const monatIdx = MONATE.indexOf(
          String(job.monat) as typeof MONATE[number]
        );
        const m = monatIdx >= 0 ? monatIdx + 1 : new Date().getMonth() + 1;
        job.datum = `${job.jahr}-${String(m).padStart(2, "0")}-01`;
      }

      return job;
    });

    // Batch insert (Supabase supports bulk)
    const { error: insertError } = await supabase
      .from("jobs")
      .insert(jobsToInsert);

    if (insertError) {
      setError(`Import-Fehler: ${insertError.message}`);
      setImporting(false);
      return;
    }

    // Log the upload
    await supabase.from("uploads").insert({
      filename: parsed.filename,
      rows_imported: jobsToInsert.length,
      rows_skipped: parsed.rows.length - nonEmptyRows.length,
      column_mapping: mapping,
    });

    setResult({
      imported: jobsToInsert.length,
      skipped: parsed.rows.length - nonEmptyRows.length,
    });
    setImporting(false);
    onImportComplete();
  };

  const reset = () => {
    setParsed(null);
    setMapping({});
    setResult(null);
    setError(null);
    setPreviewMode(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Step 1: No file loaded
  if (!parsed) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-text">Datei importieren</h3>
            <p className="text-xs text-text-muted mt-1">
              XLSX oder CSV hochladen — Spalten werden automatisch erkannt
            </p>
          </div>
        </div>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-accent hover:bg-accent-light/30 transition-colors">
          <svg
            className="w-8 h-8 text-text-dim mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <span className="text-sm text-text-muted font-medium">
            XLSX oder CSV Datei auswählen
          </span>
          <span className="text-[10px] font-mono text-text-dim mt-1">
            Automatische Spaltenerkennung aus Google-Ads Projekt Format
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        {error && (
          <p className="text-red text-xs font-mono mt-3">{error}</p>
        )}
      </div>
    );
  }

  // Step 2: File loaded — show mapping + preview
  const previewRows = getPreviewRows();
  const mappedFields = getMappedDbFields();
  const nonEmptyCount = parsed.rows.filter(
    (r) => !isRowEmpty(r, mapping)
  ).length;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {parsed.filename}
          </h3>
          <p className="text-[10px] font-mono text-text-dim mt-1">
            Tabelle: {parsed.sheetName} · {parsed.rows.length} Zeilen ·{" "}
            {parsed.headers.length} Spalten · {nonEmptyCount} importierbar
          </p>
        </div>
        <button
          onClick={reset}
          className="text-xs font-mono text-text-dim hover:text-red transition-colors"
        >
          Abbrechen
        </button>
      </div>

      {/* Column Mapping */}
      <div className="px-6 py-4 border-b border-border">
        <h4 className="text-[10px] font-mono uppercase tracking-wider text-text-dim mb-3">
          Spaltenzuordnung
          <span className="ml-2 text-accent font-medium">
            (automatisch erkannt — anpassbar)
          </span>
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {parsed.headers
            .filter((h) => h.trim() !== "")
            .map((header) => {
              const mapped = mapping[header];
              const sampleValues = parsed.rows
                .slice(0, 3)
                .map((r) => r[header])
                .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
                .map((v) => String(v))
                .slice(0, 2);

              return (
                <div
                  key={header}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                    mapped
                      ? "border-accent/30 bg-accent-light/20"
                      : "border-border bg-surface-2/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">
                      {header}
                    </p>
                    {sampleValues.length > 0 && (
                      <p className="text-[10px] font-mono text-text-dim truncate">
                        z.B. {sampleValues.join(", ")}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-text-dim shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <select
                    value={mapped || ""}
                    onChange={(e) => updateMapping(header, e.target.value)}
                    className={`text-xs font-mono rounded-md border px-2 py-1.5 outline-none min-w-[140px] ${
                      mapped
                        ? "border-accent bg-accent-light text-accent"
                        : "border-border bg-surface text-text-dim"
                    }`}
                  >
                    <option value="">— ignorieren —</option>
                    {IMPORTABLE_FIELDS.map((f) => (
                      <option
                        key={f.key}
                        value={f.key}
                        disabled={
                          mappedFields.has(f.key) && mapping[header] !== f.key
                        }
                      >
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
        </div>
      </div>

      {/* Preview Toggle */}
      <div className="px-6 py-3 border-b border-border">
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="text-xs font-mono text-accent hover:text-text transition-colors flex items-center gap-1.5"
        >
          <svg
            className={`w-3 h-3 transition-transform ${
              previewMode ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          Vorschau ({previewRows.length} von {nonEmptyCount} Zeilen)
        </button>
      </div>

      {/* Preview Table */}
      {previewMode && previewRows.length > 0 && (
        <div className="overflow-x-auto border-b border-border">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-2">
                {IMPORTABLE_FIELDS.filter((f) =>
                  mappedFields.has(f.key)
                ).map((f) => (
                  <th
                    key={f.key}
                    className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-text-dim font-medium text-left"
                  >
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 hover:bg-surface-2/50"
                >
                  {IMPORTABLE_FIELDS.filter((f) =>
                    mappedFields.has(f.key)
                  ).map((f) => {
                    const val = row[f.key];
                    const isMissing = val === null || val === undefined;
                    return (
                      <td
                        key={f.key}
                        className={`px-3 py-2 text-xs ${
                          isMissing
                            ? "text-amber font-mono font-medium"
                            : f.type === "number"
                            ? "font-mono text-right"
                            : ""
                        }`}
                      >
                        {isMissing
                          ? "???"
                          : f.type === "number"
                          ? formatCurrency(Number(val))
                          : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 flex items-center justify-between">
        {error && <p className="text-red text-xs font-mono">{error}</p>}
        {result ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="font-mono text-accent font-medium">
                {result.imported} importiert
              </span>
            </div>
            {result.skipped > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-text-dim" />
                <span className="font-mono text-text-dim">
                  {result.skipped} leer/übersprungen
                </span>
              </div>
            )}
            <button
              onClick={reset}
              className="text-xs font-mono text-accent hover:text-text ml-4"
            >
              Weitere Datei importieren
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-text-dim">
              {Object.keys(mapping).length} Spalten zugeordnet ·{" "}
              {nonEmptyCount} Zeilen
            </span>
          </div>
        )}
        {!result && (
          <button
            onClick={handleImport}
            disabled={
              importing || Object.keys(mapping).length === 0 || nonEmptyCount === 0
            }
            className="px-5 py-2.5 bg-accent text-white rounded-lg text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
          >
            {importing ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importiere...
              </>
            ) : (
              <>
                {nonEmptyCount} Aufträge importieren
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
