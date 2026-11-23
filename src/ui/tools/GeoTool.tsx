// Course 7 final project: GeoJSON Coordinate Validator with a map preview.
import { useMemo, useState } from 'react';
import type { Lang } from '../../content/types.ts';
import type { GradeResult } from '../../engine/grade.ts';
import { PRACTICE_GEOJSON, applyCertainSwaps, gradeGeoPractice, project, validateGeoJson, type GeoFinding, type GeoRule } from '../../engine/tools/geojson.ts';
import { downloadText } from '../download.ts';
import { COMMON, Editor, FileLoad, LabChecks, l, toGrade, tr, type L } from './common.tsx';

const RULE: Record<GeoRule, { name: L; fix: L }> = {
  json: { name: l('Not valid JSON', 'Неверный JSON'), fix: l('Look for a missing comma, bracket or quote near the reported place.', 'Ищите пропущенную запятую, скобку или кавычку рядом с указанным местом.') },
  type: { name: l('Wrong "type"', 'Неверный «type»'), fix: l('Use FeatureCollection → Feature → geometry.', 'Используйте FeatureCollection → Feature → geometry.') },
  features: { name: l('"features" is not a list', '«features» — не список'), fix: l('features must be an array [ ... ].', 'features должен быть массивом [ ... ].') },
  geometry: { name: l('Missing geometry', 'Нет геометрии'), fix: l('Each Feature needs a geometry object.', 'У каждого Feature должен быть объект geometry.') },
  geomType: { name: l('Unknown geometry type', 'Неизвестный тип геометрии'), fix: l('Point, LineString, Polygon or their Multi… versions.', 'Point, LineString, Polygon или их Multi-версии.') },
  coordsShape: { name: l('Position is not [lon, lat]', 'Позиция не [долгота, широта]'), fix: l('A position needs two numbers: longitude first, then latitude.', 'Позиции нужны два числа: сначала долгота, потом широта.') },
  notNumber: { name: l('Not a number', 'Не число'), fix: l('Coordinates must be numbers without quotes.', 'Координаты — числа без кавычек.') },
  lonRange: { name: l('Longitude out of range', 'Долгота вне диапазона'), fix: l('Longitude must be between −180 and 180.', 'Долгота должна быть от −180 до 180.') },
  latRange: { name: l('Latitude out of range', 'Широта вне диапазона'), fix: l('Latitude must be between −90 and 90. Check the source; do not guess.', 'Широта должна быть от −90 до 90. Сверьтесь с источником; не угадывайте.') },
  swapped: { name: l('Latitude and longitude swapped (certain)', 'Широта и долгота перепутаны (точно)'), fix: l('This order is impossible and the swapped order is valid. The "Swap certain cases" button can fix it.', 'Такой порядок невозможен, а обратный — допустим. Кнопка «Поменять точные случаи» исправит.') },
  maybeSwapped: { name: l('Possibly swapped (not certain)', 'Возможно, перепутаны (не точно)'), fix: l('Both orders are valid numbers, but only the swapped one falls inside the UK. Check the source before changing it — this is not fixed automatically.', 'Оба порядка допустимы, но в Великобританию попадает только обратный. Сверьтесь с источником — автоматически это не исправляется.') },
  lineShort: { name: l('Line has fewer than 2 points', 'В линии меньше 2 точек'), fix: l('A LineString needs at least two positions.', 'Для LineString нужно минимум две позиции.') },
  ringShort: { name: l('Polygon ring too short', 'Контур полигона слишком короткий'), fix: l('A ring needs at least 4 positions (the last repeats the first).', 'Контуру нужно минимум 4 позиции (последняя повторяет первую).') },
  ringOpen: { name: l('Polygon ring not closed', 'Контур полигона не замкнут'), fix: l('Repeat the first position at the end of the ring.', 'Повторите первую позицию в конце контура.') },
  repeatPoint: { name: l('Same point twice in a row', 'Одна точка дважды подряд'), fix: l('Remove the repeated position.', 'Удалите повтор.') },
  outsideArea: { name: l('Outside the UK', 'За пределами Великобритании'), fix: l('Valid, but outside the expected area. Check it is not a typo.', 'Допустимо, но вне ожидаемой области. Проверьте, нет ли опечатки.') },
  noId: { name: l('Feature has no id', 'У объекта нет id'), fix: l('Give every feature a unique id.', 'Дайте каждому объекту уникальный id.') },
  dupId: { name: l('Duplicate id', 'Повтор id'), fix: l('Ids must be unique.', 'id должны быть уникальными.') },
};

const LAB: Record<string, L> = {
  swapped: l('School: coordinates in the right order (decided from the source)', 'Школа: координаты в правильном порядке (по источнику)'),
  'text-number': l('Clinic: coordinates are numbers', 'Поликлиника: координаты — числа'),
  'missing-lat': l('Station: latitude added from the source', 'Станция: широта добавлена из источника'),
  'short-line': l('Bus route: at least two points', 'Автобусный маршрут: минимум две точки'),
  'open-ring': l('Park: polygon ring closed', 'Парк: контур полигона замкнут'),
  'lat-range': l('Market: latitude in range (typo fixed from the source)', 'Рынок: широта в диапазоне (опечатка исправлена по источнику)'),
  kept: l('All 7 features are still there', 'Все 7 объектов на месте'),
  clean: COMMON.clean,
};

function Preview({ text, lang }: { text: string; lang: Lang }) {
  const rep = useMemo(() => validateGeoJson(text, { requireIds: false }), [text]);
  const W = 520, H = 300;
  const { toXY, ok, inView } = project(rep.features, W, H);
  const outside = rep.features.filter((f) => f.positions.some((p) => p.ok) && !f.positions.some((p) => p.ok && inView(p.lon, p.lat))).map((f) => f.id || `#${f.index + 1}`);
  return (
    <figure className="geomap">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={lang === 'ru' ? 'Карта объектов: зелёные — без ошибок, красные — с ошибками' : 'Map of features: green has no errors, red has errors'}>
        <rect x="0" y="0" width={W} height={H} className="geobg" />
        {ok && rep.features.map((f) => {
          const pts = f.positions.filter((p) => p.ok && inView(p.lon, p.lat)).map((p) => toXY(p.lon, p.lat));
          const cls = f.ok ? 'geook' : 'geobad';
          if (!pts.length) return null;
          if (f.type === 'Point' || f.type === 'MultiPoint' || pts.length === 1) return <g key={f.index}>{pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" className={cls}><title>{f.id}</title></circle>)}</g>;
          const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
          return <path key={f.index} d={d + (f.type.includes('Polygon') ? ' Z' : '')} className={cls + (f.type.includes('Polygon') ? ' geopoly' : ' geoline')}><title>{f.id}</title></path>;
        })}
      </svg>
      <figcaption className="small muted">
        {lang === 'ru' ? 'Зелёные — без ошибок, красные — с ошибками. Точки, которые невозможно нанести, не показаны.' : 'Green: no errors. Red: has errors. Positions that cannot be plotted are not shown.'}{' '}
        {rep.features.filter((f) => !f.positions.some((p) => p.ok)).map((f) => f.id || `#${f.index + 1}`).join(', ') && (lang === 'ru' ? 'Не показаны: ' : 'Not shown: ') + rep.features.filter((f) => !f.positions.some((p) => p.ok)).map((f) => f.id || `#${f.index + 1}`).join(', ') + '. '}
        {outside.length > 0 && (lang === 'ru' ? `Далеко за пределами карты (проверьте порядок координат): ${outside.join(', ')}.` : `Far outside this map (check the coordinate order): ${outside.join(', ')}.`)}
      </figcaption>
    </figure>
  );
}

function md(file: string, findings: GeoFinding[], n: number, lang: Lang, when: Date) {
  return [
    `# GeoJSON check — ${file}`, '',
    `Checked on ${when.toISOString().slice(0, 10)} with the KUBERA Claude Academy GeoJSON Validator (RFC 7946 rules, positions are [longitude, latitude]).`, '',
    `- Features: ${n}`, `- Errors: ${findings.filter((f) => f.severity === 'error').length}`, `- Warnings: ${findings.filter((f) => f.severity === 'warning').length}`, '',
    findings.length ? '| Feature | Where | Problem | Value | How to fix |\n| --- | --- | --- | --- | --- |' : '_No problems found by these rules._',
    ...findings.map((f) => `| ${f.featureId || (f.feature >= 0 ? '#' + (f.feature + 1) : 'file')} | ${f.path} | ${f.severity}: ${tr(RULE[f.rule].name, lang)} | \`${f.value.replace(/\|/g, '\\|')}\` | ${tr(RULE[f.rule].fix, lang)} |`),
    '', '_Possible swaps are reported as warnings and are never changed automatically._', '',
  ].join('\n');
}

export default function GeoTool({ lang, answer: saved, onAnswer, onGraded }: { lang: Lang; answer: string | null; onAnswer: (a: string) => void; onGraded: (r: GradeResult) => void }) {
  const answer = saved ?? PRACTICE_GEOJSON;
  const [fileName, setFileName] = useState('practice.geojson');
  const [msg, setMsg] = useState('');
  const [shown, setShown] = useState(false);
  const rep = useMemo(() => validateGeoJson(answer, { requireIds: fileName === 'practice.geojson' }), [answer, fileName]);
  const lab = useMemo(() => gradeGeoPractice(answer), [answer]);
  const own = fileName !== 'practice.geojson';
  const certain = rep.findings.filter((f) => f.rule === 'swapped').length;
  const save = (name: string, text: string, type: string) => setMsg(tr(downloadText(name, text, type) ? COMMON.exported : COMMON.exportFail, lang));
  const base = fileName.replace(/\.(geo)?json$/i, '');
  const when = new Date();
  return (
    <div className="tool" data-testid="tool-geojson">
      <div className="row">
        <FileLoad accept=".geojson,.json,application/geo+json,application/json" lang={lang} label={COMMON.loadFile} onText={(t, n) => { onAnswer(t); setFileName(n); setShown(true); }} />
        <button type="button" onClick={() => { onAnswer(PRACTICE_GEOJSON); setFileName('practice.geojson'); }}>{tr(COMMON.sample, lang)}</button>
      </div>
      {own && <p className="note">{tr(COMMON.ownData, lang)}</p>}
      <Editor id="geo-editor" label={lang === 'ru' ? `GeoJSON (${fileName}) — исправляйте прямо здесь` : `GeoJSON (${fileName}) — fix it right here`} value={answer} onChange={onAnswer} rows={14} />
      <div className="row">
        <button className="primary" onClick={() => setShown(true)}>{tr(COMMON.audit, lang)}</button>
        {!own && <button onClick={() => { setShown(true); onAnswer(answer); onGraded(toGrade(lab.checks, answer)); }}>{tr(COMMON.check, lang)}</button>}
        {shown && certain > 0 && (
          <button onClick={() => { const r = applyCertainSwaps(answer); onAnswer(r.text); setMsg(lang === 'ru' ? `Поменяно позиций: ${r.swapped}. Возможные (неточные) случаи не тронуты.` : `Swapped ${r.swapped} position(s). Possible (uncertain) cases were left alone.`); }}>
            {lang === 'ru' ? `Поменять точные случаи (${certain})` : `Swap certain cases (${certain})`}
          </button>
        )}
      </div>
      {shown && (
        <section aria-live="polite" data-testid="geo-results">
          <p><b>{lang === 'ru' ? 'Объектов' : 'Features'}: {rep.features.length}</b> · {lang === 'ru' ? 'ошибок' : 'errors'}: {rep.findings.filter((f) => f.severity === 'error').length} · {lang === 'ru' ? 'предупреждений' : 'warnings'}: {rep.findings.filter((f) => f.severity === 'warning').length}</p>
          <Preview text={answer} lang={lang} />
          {rep.findings.length === 0 ? <p className="good">{tr(COMMON.noFindings, lang)}</p> : (
            <div className="tablewrap">
              <table className="tbl">
                <thead><tr><th>{lang === 'ru' ? 'Объект' : 'Feature'}</th><th>{lang === 'ru' ? 'Где' : 'Where'}</th><th>{lang === 'ru' ? 'Проблема' : 'Problem'}</th><th>{lang === 'ru' ? 'Значение' : 'Value'}</th><th>{lang === 'ru' ? 'Как исправить' : 'How to fix'}</th></tr></thead>
                <tbody>
                  {rep.findings.map((f, i) => (
                    <tr key={i} className={f.severity === 'warning' ? 'warnrow' : ''}><td>{f.featureId || (f.feature >= 0 ? '#' + (f.feature + 1) : '—')}</td><td className="mono">{f.path}</td><td>{f.severity === 'warning' ? '⚠ ' : '✖ '}{tr(RULE[f.rule].name, lang)}</td><td className="mono">{f.value || '—'}</td><td className="small">{tr(RULE[f.rule].fix, lang)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="row">
            <button disabled={!rep.parsed} onClick={() => save(base + '-checked.geojson', JSON.stringify(JSON.parse(answer), null, 2), 'application/geo+json')}>{lang === 'ru' ? 'Скачать .geojson' : 'Download .geojson'}</button>
            <button onClick={() => save(base + '-report.json', JSON.stringify({ tool: 'KUBERA Claude Academy — GeoJSON Validator', file: fileName, checked_at: when.toISOString(), features: rep.features.length, findings: rep.findings, note: 'Rule-based checks; possible swaps are warnings and are never changed automatically.' }, null, 2), 'application/json')}>{lang === 'ru' ? 'Скачать отчёт .json' : 'Download report .json'}</button>
            <button onClick={() => save(base + '-report.md', md(fileName, rep.findings, rep.features.length, lang, when), 'text/markdown')}>{lang === 'ru' ? 'Скачать отчёт .md' : 'Download report .md'}</button>
          </div>
          <span className="small" aria-live="polite">{msg}</span>
        </section>
      )}
      {!own && (
        <section>
          <h3>{tr(COMMON.labChecks, lang)}</h3>
          <LabChecks checks={lab.checks} labels={LAB} lang={lang} />
        </section>
      )}
    </div>
  );
}
