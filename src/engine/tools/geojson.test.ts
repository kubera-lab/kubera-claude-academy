import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_GEOJSON, GEO_PLANTED, applyCertainSwaps, gradeGeoPractice, validateGeoJson } from './geojson.ts';

const rules = (text: string, opts = {}) => validateGeoJson(text, opts).findings.map((f) => `${f.featureId || f.feature}:${f.rule}`);
const pointFc = (c: unknown) => JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', id: 'a', properties: {}, geometry: { type: 'Point', coordinates: c } }] });

test('broken JSON is reported, not thrown', () => {
  const r = validateGeoJson('{ "type": ');
  assert.equal(r.parsed, false);
  assert.equal(r.findings[0].rule, 'json');
});

test('valid UK point has no findings', () => {
  assert.deepEqual(rules(pointFc([-0.1654, 51.4012])), []);
});

test('swap: certain when one order is impossible, only a warning when both orders are valid', () => {
  assert.deepEqual(rules(pointFc([51.4031, -0.1702])), ['a:maybeSwapped']); // both orders are valid numbers: only a warning
  assert.deepEqual(rules(pointFc([-0.17, 151.4])), ['a:swapped']); // lat 151 impossible, swapped [151.4, -0.17] valid
});

test('ambiguous order is a warning and never an error; no area means no warning', () => {
  const r = validateGeoJson(pointFc([51.4031, -0.1702]));
  assert.equal(r.findings[0].severity, 'warning');
  assert.deepEqual(rules(pointFc([51.4031, -0.1702]), { area: null }), []);
});

test('NaN, text and missing values are errors', () => {
  assert.deepEqual(rules(pointFc(['-0.1', 51.4])), ['a:notNumber']);
  assert.deepEqual(rules(pointFc([-0.1])), ['a:coordsShape']);
  assert.deepEqual(rules('{"type":"Point","coordinates":[NaN, 1]}'), ['-1:json']);
  assert.deepEqual(rules(pointFc([-200, 51])), ['a:lonRange']);
});

test('lines need two positions, rings must be closed with four positions', () => {
  const line = JSON.stringify({ type: 'LineString', coordinates: [[-0.1, 51.4]] });
  assert.deepEqual(rules(line), ['0:lineShort']);
  const open = JSON.stringify({ type: 'Polygon', coordinates: [[[-0.17, 51.40], [-0.16, 51.40], [-0.16, 51.41], [-0.17, 51.41]]] });
  assert.deepEqual(rules(open), ['0:ringOpen']);
  const closed = JSON.stringify({ type: 'Polygon', coordinates: [[[-0.17, 51.40], [-0.16, 51.40], [-0.16, 51.41], [-0.17, 51.40]]] });
  assert.deepEqual(rules(closed), []);
});

test('applyCertainSwaps fixes only the certain case', () => {
  const certain = applyCertainSwaps(pointFc([-0.17, 151.4]));
  assert.equal(certain.swapped, 1);
  assert.deepEqual(JSON.parse(certain.text).features[0].geometry.coordinates, [151.4, -0.17]);
  assert.equal(applyCertainSwaps(pointFc([51.4031, -0.1702])).swapped, 0); // ambiguous: left for a person
});

test('practice file: every planted error is found', () => {
  const r = validateGeoJson(PRACTICE_GEOJSON, { requireIds: true });
  for (const p of GEO_PLANTED) assert.ok(r.findings.some((f) => f.featureId === p.feature && p.rules.includes(f.rule)), p.id);
  assert.equal(r.findings.find((f) => f.featureId === 'school')!.severity, 'warning');
});

test('lab: deleting a broken feature does not count, a correct fix passes', () => {
  const doc = JSON.parse(PRACTICE_GEOJSON);
  doc.features = doc.features.filter((f: any) => f.id !== 'market');
  const g1 = gradeGeoPractice(JSON.stringify(doc));
  assert.equal(g1.checks.find((c) => c.id === 'lat-range')!.ok, false);
  assert.equal(g1.checks.find((c) => c.id === 'kept')!.ok, false);
  const fixed = JSON.parse(PRACTICE_GEOJSON);
  const set = (id: string, g: unknown) => { fixed.features.find((f: any) => f.id === id).geometry = g; };
  set('school', { type: 'Point', coordinates: [-0.1702, 51.4031] });
  set('clinic', { type: 'Point', coordinates: [-0.1588, 51.3986] });
  set('station', { type: 'Point', coordinates: [-0.1597, 51.3994] });
  set('bus-route', { type: 'LineString', coordinates: [[-0.1654, 51.4012], [-0.1597, 51.3994]] });
  set('park', { type: 'Polygon', coordinates: [[[-0.172, 51.405], [-0.168, 51.405], [-0.168, 51.402], [-0.172, 51.402], [-0.172, 51.405]]] });
  set('market', { type: 'Point', coordinates: [-0.1611, 51.4002] });
  const g2 = gradeGeoPractice(JSON.stringify(fixed));
  assert.deepEqual(g2.checks.filter((c) => !c.ok), []);
});
