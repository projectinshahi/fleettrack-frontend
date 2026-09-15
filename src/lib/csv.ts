/**
 * CSV generation for the export buttons on Trips / Trip Requests / Vehicles.
 *
 * One place that knows the RFC 4180 rules so no page hand-rolls string joining:
 * quoting, embedded quotes/commas/newlines, null handling, dates, list values, the
 * Excel BOM, and the spreadsheet formula-injection guard below.
 *
 * Column sets for each export live in `csv-exports.ts`; this module stays domain-free.
 */

import { downloadBlob } from "@/lib/download";

/** One output column: a header plus how to read it off a row. */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

/**
 * Cells that a spreadsheet would execute rather than display.
 *
 * Excel/Sheets treat a leading =, +, -, @ (and a leading tab/CR) as the start of a
 * formula, so an address or note a user typed as `=HYPERLINK(...)` becomes live content
 * in the opened file. Exported data here is user-supplied (addresses, notes, driver
 * names), so every such cell is prefixed with an apostrophe, which spreadsheets strip on
 * display and treat as "this is text". Without it, a CSV export is a formula-injection
 * vector into whoever opens the file.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Characters that force a field to be quoted per RFC 4180. */
const MUST_QUOTE = /[",\r\n]/;

/**
 * Render one value as a CSV field.
 *
 * - null / undefined / NaN     → empty (never the string "null", which reads as data)
 * - Date                       → ISO 8601 (callers wanting local time format it first)
 * - array                      → " | "-joined, so multi-value cells stay in one column
 * - everything else            → String(value)
 */
export function csvCell(value: unknown): string {
  let text: string;

  if (value === null || value === undefined) {
    text = "";
  } else if (value instanceof Date) {
    text = Number.isNaN(value.getTime()) ? "" : value.toISOString();
  } else if (Array.isArray(value)) {
    text = value
      .filter((item) => item !== null && item !== undefined && item !== "")
      .map((item) => String(item))
      .join(" | ");
  } else if (typeof value === "number") {
    text = Number.isFinite(value) ? String(value) : "";
  } else {
    text = String(value);
  }

  if (text === "") return "";

  // Neutralise a leading formula character BEFORE quoting, so the guard survives inside
  // the quoted field.
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;

  if (MUST_QUOTE.test(text)) {
    // A literal quote is escaped by doubling it, then the whole field is quoted.
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/**
 * Rows → CSV text.
 *
 * CRLF line endings and a leading UTF-8 BOM: Excel on Windows otherwise reads a UTF-8
 * file as the local codepage and mangles non-ASCII (Malayalam/accented place names in
 * this data), and treats bare LF inconsistently.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows.map((row) =>
    columns.map((c) => csvCell(c.value(row))).join(","),
  );
  return `﻿${[header, ...body].join("\r\n")}\r\n`;
}

/** Consistent, readable local date-time for every export ("" when absent/invalid). */
export function csvDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

/** Build the CSV and hand it to the browser as a download. */
export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  const blob = new Blob([toCsv(rows, columns)], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, filename);
}
