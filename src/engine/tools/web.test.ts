import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_HTML, WEB_PLANTED, contrastRatio, gradeWebPractice, inspect, parseColor, previewCopy } from './web.ts';

const rules = (html: string) => inspect(html).map((f) => f.rule);

test('WCAG contrast: black on white is 21:1, #777 on white is about 4.48:1', () => {
  assert.equal(contrastRatio([0, 0, 0], [255, 255, 255]).toFixed(1), '21.0');
  assert.equal(contrastRatio(parseColor('#777')!, parseColor('white')!).toFixed(2), '4.48');
  assert.equal(parseColor('not-a-colour'), null);
});

test('security rules: script, handlers, javascript: URLs (also obfuscated), iframe without sandbox, target=_blank', () => {
  assert.deepEqual(rules('<script>x()</script>'), ['script']);
  assert.deepEqual(rules('<img src=x alt="" onerror="steal()">'), ['eventHandler']);
  assert.deepEqual(rules('<a href=" java\tscript:alert(1)">go</a>'), ['jsUrl']);
  assert.deepEqual(rules('<iframe src="https://example.org" title="map"></iframe>'), ['iframeNoSandbox']);
  assert.deepEqual(rules('<iframe src="https://example.org" title="map" sandbox></iframe>'), []);
  assert.deepEqual(rules('<a href="https://x.org" target="_blank">x</a>'), ['blankNoopener']);
  assert.deepEqual(rules('<a href="https://x.org" target="_blank" rel="noopener">x</a>'), []);
});

test('accessibility rules: labels by for=, by wrapping, by aria-label', () => {
  assert.deepEqual(rules('<input type="text">'), ['inputLabel']);
  assert.deepEqual(rules('<label for="a">A</label><input id="a">'), []);
  assert.deepEqual(rules('<label>A <input></label>'), []);
  assert.deepEqual(rules('<input aria-label="Search">'), []);
  assert.deepEqual(rules('<input type="hidden">'), []);
});

test('headings: missing h1, two h1, skipped level', () => {
  assert.deepEqual(rules('<body><h2>x</h2></body>'), ['noH1']);
  assert.deepEqual(rules('<h1>a</h1><h1>b</h1>'), ['manyH1']);
  assert.deepEqual(rules('<h1>a</h1><h3>b</h3>'), ['headingSkip']);
});

test('empty buttons and links; an image with alt gives a name', () => {
  assert.deepEqual(rules('<button></button>'), ['emptyButton']);
  assert.deepEqual(rules('<button aria-label="Close"></button>'), []);
  assert.deepEqual(rules('<a href="/"><img src="logo.png" alt="Home"></a>'), []);
  assert.deepEqual(rules('<a href="/"> </a>'), ['emptyLink']);
});

test('practice page: every planted problem is found with a line number', () => {
  const f = inspect(PRACTICE_HTML);
  for (const p of WEB_PLANTED) assert.ok(f.some((x) => x.rule === p.rule), p.id);
  assert.equal(f.find((x) => x.rule === 'contrast')!.detail, '2.85:1');
  assert.equal(f.find((x) => x.rule === 'script')!.line, 17);
});

test('lab: removing the form does not pass; a correct fix passes', () => {
  const noForm = PRACTICE_HTML.replace(/<form>[\s\S]*<\/form>/, '');
  assert.equal(gradeWebPractice(noForm).checks.find((c) => c.id === 'kept')!.ok, false);
  const fixed = `<!doctype html>
<html lang="en">
<head><title>Corner Bakery — order</title></head>
<body>
  <h1>Corner Bakery</h1>
  <img src="bread.jpg" alt="Loaves of fresh bread on a shelf">
  <p style="color:#595959; background-color:#ffffff">Fresh bread every morning.</p>
  <form>
    <label for="name">Name</label>
    <input type="text" id="name">
    <label for="email">Email</label>
    <input type="email" id="email">
    <button type="submit">Send order</button>
  </form>
  <a href="/offers">Offers</a>
  <a href="https://example.org/map" target="_blank" rel="noopener noreferrer">Find us</a>
  <h2>Opening hours</h2>
</body>
</html>`;
  const g = gradeWebPractice(fixed);
  assert.deepEqual(g.findings, []);
  assert.deepEqual(g.checks.filter((c) => !c.ok), []);
});

test('preview copy has no scripts, handlers or javascript: links (sandbox stays the main guard)', () => {
  const c = previewCopy(PRACTICE_HTML + '<a href=javascript:x()>a</a><iframe src="https://x.org"></iframe>');
  assert.doesNotMatch(c, /<script|onclick|javascript:|<iframe/i);
  assert.match(c, /Corner Bakery/);
  assert.deepEqual(inspect(c).filter((f) => ['script', 'eventHandler', 'jsUrl', 'iframeNoSandbox'].includes(f.rule)), []);
});
