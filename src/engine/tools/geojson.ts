// Course 7 tool: GeoJSON Coordinate Validator. Pure functions (RFC 7946 rules that matter most).
// Positions are [longitude, latitude]. Nothing is "fixed" silently: a swap is applied only on request
// and only where the swap is certain (one order is impossible, the other is valid).

export type GeoRule =
  | 'json' | 'type' | 'features' | 'geometry' | 'geomType' | 'coordsShape'
  | 'notNumber' | 'lonRange' | 'latRange' | 'swapped' | 'maybeSwapped'
  | 'lineShort' | 'ringShort' | 'ringOpen' | 'repeatPoint' | 'outsideArea' | 'noId' | 'dupId';

export type Severity = 'error' | 'warning';

export interface GeoFinding {
  rule: GeoRule;
  severity: Severity;
  /** Feature index (0-based), -1 for the whole file. */
  feature: number;
  featureId: string;
  /** Path inside the feature, e.g. "coordinates[2]". */
  path: string;
  value: string;
}

export interface BBox { west: number; south: number; east: number; north: number }

/** Great Britain and Northern Ireland, generous. Used only to warn, never to correct. */
export const UK_BBOX: BBox = { west: -8.7, south: 49.8, east: 1.9, north: 60.9 };

const TYPES = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
const inBox = (lon: number, lat: number, b: BBox) => lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north;
const show = (v: unknown) => { try { return JSON.stringify(v)?.slice(0, 60) ?? String(v); } catch { return String(v); } };

export interface ParsedFeature { index: number; id: string; type: string; positions: { path: string; lon: number; lat: number; ok: boolean }[]; ok: boolean }

export interface GeoReport { findings: GeoFinding[]; features: ParsedFeature[]; parsed: boolean }

function checkPosition(p: unknown, path: string, fi: number, fid: string, area: BBox | null, out: GeoFinding[]): { lon: number; lat: number; ok: boolean } | null {
  const add = (rule: GeoRule, severity: Severity, value = show(p)) => out.push({ rule, severity, feature: fi, featureId: fid, path, value });
  if (!Array.isArray(p) || p.length < 2 || p.length > 3) { add('coordsShape', 'error'); return null; }
  const [lon, lat] = p;
  if (typeof lon !== 'number' || typeof lat !== 'number' || !Number.isFinite(lon) || !Number.isFinite(lat) || (p.length === 3 && (typeof p[2] !== 'number' || !Number.isFinite(p[2])))) {
    add('notNumber', 'error');
    return null;
  }
  const lonOk = lon >= -180 && lon <= 180, latOk = lat >= -90 && lat <= 90;
  const swapValid = lat >= -180 && lat <= 180 && lon >= -90 && lon <= 90;
  if (!latOk && lonOk && swapValid) { add('swapped', 'error'); return { lon, lat, ok: false }; }
  if (!lonOk) add('lonRange', 'error');
  if (!latOk) add('latRange', 'error');
  if (!lonOk || !latOk) return { lon, lat, ok: false };
  if (area && !inBox(lon, lat, area)) {
    if (inBox(lat, lon, area)) add('maybeSwapped', 'warning');
    else add('outsideArea', 'warning');
  }
  return { lon, lat, ok: true };
}

function walkGeometry(g: any, fi: number, fid: string, area: BBox | null, out: GeoFinding[]): ParsedFeature['positions'] {
  const pos: ParsedFeature['positions'] = [];
  const add = (rule: GeoRule, path: string, value: string) => out.push({ rule, severity: rule === 'repeatPoint' ? 'warning' : 'error', feature: fi, featureId: fid, path, value });
  if (!g || typeof g !== 'object') { add('geometry', 'geometry', show(g)); return pos; }
  if (!TYPES.includes(g.type)) { add('geomType', 'geometry.type', show(g.type)); return pos; }
  const pt = (p: unknown, path: string) => { const r = checkPosition(p, path, fi, fid, area, out); if (r) pos.push({ path, ...r }); };
  const line = (arr: unknown, path: string, ring: boolean) => {
    if (!Array.isArray(arr)) { add('coordsShape', path, show(arr)); return; }
    arr.forEach((p, i) => pt(p, `${path}[${i}]`));
    for (let i = 1; i < arr.length; i++) if (!ring || i < arr.length - 1) if (JSON.stringify(arr[i]) === JSON.stringify(arr[i - 1])) add('repeatPoint', `${path}[${i}]`, show(arr[i]));
    if (ring) {
      if (arr.length < 4) add('ringShort', path, String(arr.length));
      else if (JSON.stringify(arr[0]) !== JSON.stringify(arr[arr.length - 1])) add('ringOpen', path, show(arr[arr.length - 1]));
    } else if (arr.length < 2) add('lineShort', path, String(arr.length));
  };
  const c = g.coordinates;
  const P = 'coordinates';
  if (!Array.isArray(c)) { add('coordsShape', P, show(c)); return pos; }
  switch (g.type) {
    case 'Point': pt(c, P); break;
    case 'MultiPoint': c.forEach((p: unknown, i: number) => pt(p, `${P}[${i}]`)); break;
    case 'LineString': line(c, P, false); break;
    case 'MultiLineString': c.forEach((l: unknown, i: number) => line(l, `${P}[${i}]`, false)); break;
    case 'Polygon': c.forEach((r: unknown, i: number) => line(r, `${P}[${i}]`, true)); break;
    case 'MultiPolygon': c.forEach((poly: unknown, i: number) => (Array.isArray(poly) ? poly.forEach((r: unknown, j: number) => line(r, `${P}[${i}][${j}]`, true)) : add('coordsShape', `${P}[${i}]`, show(poly)))); break;
  }
  return pos;
}

export function validateGeoJson(text: string, opts: { area?: BBox | null; requireIds?: boolean } = {}): GeoReport {
  const area = opts.area === undefined ? UK_BBOX : opts.area;
  const findings: GeoFinding[] = [];
  let doc: any;
  try { doc = JSON.parse(text); } catch (e) {
    findings.push({ rule: 'json', severity: 'error', feature: -1, featureId: '', path: '', value: String((e as Error).message).slice(0, 80) });
    return { findings, features: [], parsed: false };
  }
  let feats: any[] = [];
  if (doc?.type === 'FeatureCollection') {
    if (!Array.isArray(doc.features)) { findings.push({ rule: 'features', severity: 'error', feature: -1, featureId: '', path: 'features', value: show(doc.features) }); return { findings, features: [], parsed: true }; }
    feats = doc.features;
  } else if (doc?.type === 'Feature') feats = [doc];
  else if (TYPES.includes(doc?.type)) feats = [{ type: 'Feature', geometry: doc, properties: {} }];
  else { findings.push({ rule: 'type', severity: 'error', feature: -1, featureId: '', path: 'type', value: show(doc?.type) }); return { findings, features: [], parsed: true }; }
  const features: ParsedFeature[] = [];
  const ids = new Map<string, number>();
  feats.forEach((f, i) => {
    const fid = f && (typeof f.id === 'string' || typeof f.id === 'number') ? String(f.id) : '';
    if (!f || f.type !== 'Feature') findings.push({ rule: 'type', severity: 'error', feature: i, featureId: fid, path: 'type', value: show(f?.type) });
    if (opts.requireIds && !fid) findings.push({ rule: 'noId', severity: 'error', feature: i, featureId: '', path: 'id', value: '' });
    if (fid) { if (ids.has(fid)) findings.push({ rule: 'dupId', severity: 'error', feature: i, featureId: fid, path: 'id', value: fid }); else ids.set(fid, i); }
    const before = findings.length;
    const positions = walkGeometry(f?.geometry, i, fid, area, findings);
    const errs = findings.slice(before).some((x) => x.severity === 'error');
    features.push({ index: i, id: fid, type: f?.geometry?.type ?? '?', positions, ok: !errs });
  });
  return { findings, features, parsed: true };
}

/** Swap [lat, lon] → [lon, lat] for positions flagged as certainly swapped. Returns new text and how many changed. */
export function applyCertainSwaps(text: string): { text: string; swapped: number } {
  let doc: any;
  try { doc = JSON.parse(text); } catch { return { text, swapped: 0 }; }
  let n = 0;
  const fix = (p: any) => {
    if (Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number') {
      const [lon, lat] = p;
      if (lon >= -180 && lon <= 180 && !(lat >= -90 && lat <= 90) && lat >= -180 && lat <= 180 && lon >= -90 && lon <= 90) { p[0] = lat; p[1] = lon; n++; }
      return;
    }
    if (Array.isArray(p)) p.forEach(fix);
  };
  const geoms: any[] = doc?.type === 'FeatureCollection' ? (doc.features ?? []).map((f: any) => f?.geometry) : doc?.type === 'Feature' ? [doc.geometry] : [doc];
  for (const g of geoms) if (g && Array.isArray(g.coordinates)) fix(g.coordinates);
  return { text: JSON.stringify(doc, null, 2), swapped: n };
}

// ---------- practice file (synthetic places near a fictional town; real-looking UK coordinates) ----------
export const PRACTICE_GEOJSON = `{
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "id": "library", "properties": { "name": "Town library" }, "geometry": { "type": "Point", "coordinates": [-0.1654, 51.4012] } },
    { "type": "Feature", "id": "school", "properties": { "name": "Primary school" }, "geometry": { "type": "Point", "coordinates": [51.4031, -0.1702] } },
    { "type": "Feature", "id": "clinic", "properties": { "name": "Health clinic" }, "geometry": { "type": "Point", "coordinates": ["-0.1588", 51.3986] } },
    { "type": "Feature", "id": "station", "properties": { "name": "Railway station" }, "geometry": { "type": "Point", "coordinates": [-0.1597] } },
    { "type": "Feature", "id": "bus-route", "properties": { "name": "Bus route 1" }, "geometry": { "type": "LineString", "coordinates": [[-0.1654, 51.4012]] } },
    { "type": "Feature", "id": "park", "properties": { "name": "Green park" }, "geometry": { "type": "Polygon", "coordinates": [[[-0.172, 51.405], [-0.168, 51.405], [-0.168, 51.402], [-0.172, 51.402]]] } },
    { "type": "Feature", "id": "market", "properties": { "name": "Market square" }, "geometry": { "type": "Point", "coordinates": [-0.1611, 251.4002] } }
  ]
}
`;

export const PRACTICE_GEO_IDS = ['library', 'school', 'clinic', 'station', 'bus-route', 'park', 'market'];

/** The errors planted in the practice file; each is a lab check. */
export const GEO_PLANTED: { id: string; feature: string; rules: GeoRule[] }[] = [
  { id: 'swapped', feature: 'school', rules: ['maybeSwapped', 'swapped'] },
  { id: 'text-number', feature: 'clinic', rules: ['notNumber'] },
  { id: 'missing-lat', feature: 'station', rules: ['coordsShape'] },
  { id: 'short-line', feature: 'bus-route', rules: ['lineShort'] },
  { id: 'open-ring', feature: 'park', rules: ['ringOpen', 'ringShort'] },
  { id: 'lat-range', feature: 'market', rules: ['latRange', 'swapped'] },
];

export function gradeGeoPractice(text: string): { checks: { id: string; ok: boolean }[]; report: GeoReport } {
  const report = validateGeoJson(text, { requireIds: true });
  const present = new Map(report.features.map((f) => [f.id, f]));
  const kept = PRACTICE_GEO_IDS.every((id) => present.has(id) && (present.get(id)!.positions.length > 0));
  const checks = GEO_PLANTED.map((p) => ({
    id: p.id,
    ok: present.has(p.feature) && present.get(p.feature)!.positions.length > 0 && !report.findings.some((f) => f.featureId === p.feature && (f.severity === 'error' || p.rules.includes(f.rule))),
  }));
  checks.push({ id: 'kept', ok: report.parsed && kept });
  checks.push({ id: 'clean', ok: report.parsed && kept && report.findings.length === 0 });
  return { checks, report };
}

/** Project positions into an SVG box (equirectangular, enough for a small area). */
export function project(features: ParsedFeature[], w: number, h: number, pad = 12, area: BBox | null = UK_BBOX) {
  const all = features.flatMap((f) => f.positions.filter((p) => p.ok));
  // Fit the view to positions inside the expected area when there are any, so one misplaced point
  // (for example a swapped pair landing in Africa) does not shrink everything else to a dot.
  const inArea = area ? all.filter((p) => inBox(p.lon, p.lat, area)) : [];
  const pts = inArea.length ? inArea : all;
  if (!pts.length) return { toXY: (_lon: number, _lat: number) => [w / 2, h / 2] as [number, number], ok: false, inView: (_lon: number, _lat: number) => false };
  let w0 = Math.min(...pts.map((p) => p.lon)), e0 = Math.max(...pts.map((p) => p.lon));
  let s0 = Math.min(...pts.map((p) => p.lat)), n0 = Math.max(...pts.map((p) => p.lat));
  if (e0 - w0 < 1e-6) { w0 -= 0.005; e0 += 0.005; }
  if (n0 - s0 < 1e-6) { s0 -= 0.005; n0 += 0.005; }
  const k = Math.cos(((s0 + n0) / 2) * Math.PI / 180);
  const sx = (w - 2 * pad) / ((e0 - w0) * k), sy = (h - 2 * pad) / (n0 - s0);
  const s = Math.min(sx, sy);
  const inView = (lon: number, lat: number) => lon >= w0 && lon <= e0 && lat >= s0 && lat <= n0;
  return { toXY: (lon: number, lat: number) => [pad + (lon - w0) * k * s, h - pad - (lat - s0) * s] as [number, number], ok: true, inView };
}
