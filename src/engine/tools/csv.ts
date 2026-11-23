// Course 5 tool: CSV Data Quality Auditor. Pure functions, no network, no AI.
// The same file always produces the same findings, in the same order.

export interface CsvTable {
  header: string[];
  rows: string[][];
  /** 1-based line number in the file for each data row (header is line 1). */
  lines: number[];
}

/** RFC 4180 style parser: commas, double quotes, "" escapes, CRLF or LF. */
export function parseCsv(text: string): CsvTable | { error: string } {
  const src = text.replace(/^﻿/, '');
  const records: { cells: string[]; line: number }[] = [];
  let cell = '';
  let cells: string[] = [];
  let inQ = false;
  let line = 1;
  let startLine = 1;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else {
        if (c === '\n') line++;
        cell += c;
      }
      continue;
    }
    if (c === '"' && cell === '') { inQ = true; continue; }
    if (c === ',') { cells.push(cell); cell = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') {
      cells.push(cell);
      records.push({ cells, line: startLine });
      cells = []; cell = ''; line++; startLine = line;
      continue;
    }
    cell += c;
  }
  if (inQ) return { error: 'unclosedQuote' };
  if (cell !== '' || cells.length) { cells.push(cell); records.push({ cells, line: startLine }); }
  const nonEmpty = records.filter((r) => r.cells.some((x) => x.trim() !== ''));
  if (!nonEmpty.length) return { error: 'empty' };
  const header = nonEmpty[0].cells.map((h) => h.trim());
  return { header, rows: nonEmpty.slice(1).map((r) => r.cells), lines: nonEmpty.slice(1).map((r) => r.line) };
}

export function toCsv(t: { header: string[]; rows: string[][] }): string {
  const q = (v: string) => (/[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);
  return [t.header, ...t.rows].map((r) => r.map(q).join(',')).join('\n') + '\n';
}

export type Rule = 'columns' | 'width' | 'required' | 'duplicate' | 'date' | 'number' | 'postcode' | 'conflict';

export interface Finding {
  rule: Rule;
  /** Data row index (0-based) or -1 for the whole file. */
  row: number;
  line: number;
  column: string;
  value: string;
  /** Row index of the record this one duplicates or conflicts with. */
  other?: number;
  /** Key of the record (for example the id), so findings can be tracked across edits. */
  key: string;
}

export interface Schema {
  required: string[];
  /** Columns that together identify one record (for example ["id", "source"]). */
  key: string[];
  dates: string[];
  numbers: { column: string; min?: number; integer?: boolean }[];
  postcodes: string[];
  /** When this column exists, records with the same `conflictKey` from different sources are compared. */
  sourceColumn?: string;
  conflictKey?: string;
  conflictFields?: string[];
}

export const PROPERTY_SCHEMA: Schema = {
  required: ['id', 'address', 'postcode', 'sale_date', 'price_gbp', 'source'],
  key: ['id', 'source'],
  dates: ['sale_date'],
  numbers: [{ column: 'price_gbp', min: 1, integer: true }, { column: 'bedrooms', min: 0, integer: true }],
  postcodes: ['postcode'],
  sourceColumn: 'source',
  conflictKey: 'id',
  conflictFields: ['price_gbp', 'sale_date'],
};

/** ISO date YYYY-MM-DD that exists in the calendar. */
export function validIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function validPostcode(s: string): boolean {
  const t = s.toUpperCase().replace(/\s+/g, '');
  return /^[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2}$/.test(t);
}

/** A plain number: optional minus, digits, optional decimals. "£1,000" and "abc" are not numbers. */
export function parseNumber(s: string): number | null {
  const t = s.trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

export function audit(table: CsvTable, schema: Schema): Finding[] {
  const out: Finding[] = [];
  const col = (name: string) => table.header.indexOf(name);
  const missingCols = schema.required.filter((c) => col(c) < 0);
  for (const c of missingCols) out.push({ rule: 'columns', row: -1, line: 1, column: c, value: '', key: '' });
  const keyOf = (r: string[]) => schema.key.map((k) => (col(k) >= 0 ? (r[col(k)] ?? '').trim().toUpperCase() : '')).join('|');
  const idOf = (r: string[]) => (col(schema.conflictKey ?? schema.key[0]) >= 0 ? (r[col(schema.conflictKey ?? schema.key[0])] ?? '').trim() : '');
  const seen = new Map<string, number>();
  table.rows.forEach((r, i) => {
    const line = table.lines[i];
    const key = idOf(r) || `row ${i + 1}`;
    const v = (c: string) => (col(c) >= 0 ? (r[col(c)] ?? '') : '');
    if (r.length !== table.header.length) out.push({ rule: 'width', row: i, line, column: '', value: String(r.length), key });
    for (const c of schema.required) if (col(c) >= 0 && v(c).trim() === '') out.push({ rule: 'required', row: i, line, column: c, value: '', key });
    for (const c of schema.dates) if (col(c) >= 0 && v(c).trim() !== '' && !validIsoDate(v(c))) out.push({ rule: 'date', row: i, line, column: c, value: v(c), key });
    for (const n of schema.numbers) {
      if (col(n.column) < 0 || v(n.column).trim() === '') continue;
      const x = parseNumber(v(n.column));
      if (x === null || (n.min !== undefined && x < n.min) || (n.integer && !Number.isInteger(x))) out.push({ rule: 'number', row: i, line, column: n.column, value: v(n.column), key });
    }
    for (const c of schema.postcodes) if (col(c) >= 0 && v(c).trim() !== '' && !validPostcode(v(c))) out.push({ rule: 'postcode', row: i, line, column: c, value: v(c), key });
    const k = keyOf(r);
    if (schema.key.every((kc) => col(kc) >= 0) && k.replace(/\|/g, '') !== '') {
      if (seen.has(k)) out.push({ rule: 'duplicate', row: i, line, column: schema.key.join('+'), value: k.replace(/\|/g, ' / '), other: seen.get(k), key });
      else seen.set(k, i);
    }
  });
  // Conflicts between sources: same record id, different source, different value.
  if (schema.sourceColumn && schema.conflictKey && col(schema.sourceColumn) >= 0 && col(schema.conflictKey) >= 0) {
    const byId = new Map<string, number[]>();
    table.rows.forEach((r, i) => {
      const id = (r[col(schema.conflictKey!)] ?? '').trim();
      if (id) byId.set(id, [...(byId.get(id) ?? []), i]);
    });
    for (const [id, idx] of byId) {
      for (let a = 0; a < idx.length; a++) {
        for (let b = a + 1; b < idx.length; b++) {
          const ra = table.rows[idx[a]], rb = table.rows[idx[b]];
          const sa = (ra[col(schema.sourceColumn)] ?? '').trim().toLowerCase(), sb = (rb[col(schema.sourceColumn)] ?? '').trim().toLowerCase();
          if (!sa || !sb || sa === sb) continue;
          for (const f of schema.conflictFields ?? []) {
            if (col(f) < 0) continue;
            const va = (ra[col(f)] ?? '').trim(), vb = (rb[col(f)] ?? '').trim();
            if (va && vb && va !== vb) out.push({ rule: 'conflict', row: idx[b], line: table.lines[idx[b]], column: f, value: `${sa}: ${va} ≠ ${sb}: ${vb}`, other: idx[a], key: id });
          }
        }
      }
    }
  }
  const order: Rule[] = ['columns', 'width', 'required', 'duplicate', 'date', 'number', 'postcode', 'conflict'];
  return out.sort((x, y) => x.row - y.row || order.indexOf(x.rule) - order.indexOf(y.rule) || x.column.localeCompare(y.column));
}

/** Quality score 0–100: share of checked cells and rows without a finding. Deterministic. */
export function qualityScore(table: CsvTable, findings: Finding[]): number {
  if (findings.some((f) => f.rule === 'columns')) return 0;
  if (!table.rows.length) return 0;
  const badRows = new Set(findings.filter((f) => f.row >= 0).map((f) => f.row));
  return Math.round((100 * (table.rows.length - badRows.size)) / table.rows.length);
}

export function summary(findings: Finding[]): Record<Rule, number> {
  const s = { columns: 0, width: 0, required: 0, duplicate: 0, date: 0, number: 0, postcode: 0, conflict: 0 } as Record<Rule, number>;
  for (const f of findings) s[f.rule]++;
  return s;
}

// ---------- the practice dataset (synthetic: every address, id and price is invented) ----------
export const PRACTICE_CSV = `id,address,postcode,sale_date,price_gbp,bedrooms,source
P01,12 Example Road,AB1 2CD,2026-03-14,325000,3,land_registry
P02,Flat 4 Sample Court,AB1 3EF,2026-04-02,198000,1,land_registry
P03,7 Demo Close,AB2 4GH,2026-02-27,410000,4,land_registry
P03,7 Demo Close,AB2 4GH,2026-02-27,410000,4,land_registry
P04,3 Test Lane,,2026-05-09,287500,2,land_registry
P05,21 Mock Avenue,AB3 5JK,2026-02-31,352000,3,land_registry
P06,9 Pilot Street,AB3 6LM,14/06/2026,240000,2,land_registry
P07,15 Trial Gardens,AB4 7NP,2026-06-20,ABC,3,land_registry
P08,2 Draft Mews,AB4 8QR,2026-07-01,615000,-1,land_registry
P09,30 Proof Road,AB5 9ST9,2026-07-18,299950,3,land_registry
P10,5 Check Way,AB5 1UV,2026-08-03,455000,4,land_registry
P10,5 Check Way,AB5 1UV,2026-08-03,465000,4,agent
`;

/** The errors planted in the practice file. Each one is a lab check. */
export const PLANTED: { id: string; rule: Rule; key: string; column: string }[] = [
  { id: 'dup', rule: 'duplicate', key: 'P03', column: 'id+source' },
  { id: 'required', rule: 'required', key: 'P04', column: 'postcode' },
  { id: 'impossible-date', rule: 'date', key: 'P05', column: 'sale_date' },
  { id: 'date-format', rule: 'date', key: 'P06', column: 'sale_date' },
  { id: 'not-number', rule: 'number', key: 'P07', column: 'price_gbp' },
  { id: 'negative', rule: 'number', key: 'P08', column: 'bedrooms' },
  { id: 'postcode', rule: 'postcode', key: 'P09', column: 'postcode' },
  { id: 'conflict', rule: 'conflict', key: 'P10', column: 'price_gbp' },
];

export const PRACTICE_IDS = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10'];

export interface LabCheck { id: string; ok: boolean }

/**
 * Lab result for the practice file. A planted error counts as fixed only when its finding is gone
 * AND the record is still in the file (deleting a record does not fix it). All ids must remain.
 */
export function gradePractice(text: string): { checks: LabCheck[]; findings: Finding[]; parsed: boolean } {
  const t = parseCsv(text);
  if ('error' in t) return { checks: [...PLANTED.map((p) => ({ id: p.id, ok: false })), { id: 'kept', ok: false }, { id: 'clean', ok: false }], findings: [], parsed: false };
  const findings = audit(t, PROPERTY_SCHEMA);
  const idCol = t.header.indexOf('id');
  const ids = new Set(idCol >= 0 ? t.rows.map((r) => (r[idCol] ?? '').trim()) : []);
  const kept = PRACTICE_IDS.every((id) => ids.has(id));
  const checks = PLANTED.map((p) => ({ id: p.id, ok: ids.has(p.key) && !findings.some((f) => f.key === p.key && f.rule === p.rule && (p.rule === 'duplicate' || f.column === p.column)) }));
  checks.push({ id: 'kept', ok: kept });
  checks.push({ id: 'clean', ok: findings.length === 0 && kept });
  return { checks, findings, parsed: true };
}

export function reportJson(file: string, t: CsvTable, findings: Finding[], when: Date): string {
  return JSON.stringify({
    tool: 'KUBERA Claude Academy — CSV Data Quality Auditor',
    file,
    checked_at: when.toISOString(),
    rows: t.rows.length,
    columns: t.header,
    quality_score: qualityScore(t, findings),
    summary: summary(findings),
    findings: findings.map((f) => ({ rule: f.rule, line: f.line, record: f.key, column: f.column, value: f.value })),
    note: 'Rule-based checks only. A clean result means these rules found nothing, not that every value is true.',
  }, null, 2);
}
