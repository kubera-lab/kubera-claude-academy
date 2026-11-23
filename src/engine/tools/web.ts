// Course 8 tool: HTML/CSS Security & Accessibility Inspector. Pure functions, runs in Node and the browser.
// It checks a fixed list of common rules. It does NOT prove a page is safe from XSS or WCAG-conformant.

export type WebRule =
  // security
  | 'script' | 'eventHandler' | 'jsUrl' | 'iframeNoSandbox' | 'srcdoc' | 'objectEmbed' | 'blankNoopener' | 'cssExpression' | 'formJsAction' | 'metaRefresh'
  // accessibility
  | 'imgAlt' | 'inputLabel' | 'noH1' | 'manyH1' | 'headingSkip' | 'htmlLang' | 'emptyButton' | 'emptyLink' | 'dupId' | 'tabindex' | 'contrast';

export type Area = 'security' | 'a11y';
export const AREA: Record<WebRule, Area> = {
  script: 'security', eventHandler: 'security', jsUrl: 'security', iframeNoSandbox: 'security', srcdoc: 'security', objectEmbed: 'security',
  blankNoopener: 'security', cssExpression: 'security', formJsAction: 'security', metaRefresh: 'security',
  imgAlt: 'a11y', inputLabel: 'a11y', noH1: 'a11y', manyH1: 'a11y', headingSkip: 'a11y', htmlLang: 'a11y', emptyButton: 'a11y', emptyLink: 'a11y', dupId: 'a11y', tabindex: 'a11y', contrast: 'a11y',
};

export interface WebFinding { rule: WebRule; line: number; snippet: string; detail?: string }

interface Tag { name: string; attrs: Record<string, string>; close: boolean; selfClose: boolean; line: number; raw: string; index: number; end: number }

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

export function tokenize(html: string): { tags: Tag[]; text: { at: number; text: string }[] } {
  const tags: Tag[] = [];
  const text: { at: number; text: string }[] = [];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const lineAt = (i: number) => html.slice(0, i).split('\n').length;
  while ((m = re.exec(html))) {
    if (m.index > last) text.push({ at: last, text: html.slice(last, m.index) });
    last = re.lastIndex;
    if (m[0].startsWith('<!--')) continue;
    const name = m[1].toLowerCase();
    const attrs: Record<string, string> = {};
    const ar = /([^\s"'>/=]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
    let a: RegExpExecArray | null;
    while ((a = ar.exec(m[2] ?? ''))) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5] ?? '';
    const tag: Tag = { name, attrs, close: m[0].startsWith('</'), selfClose: m[3] === '/' || VOID.has(name), line: lineAt(m.index), raw: m[0].slice(0, 90), index: m.index, end: re.lastIndex };
    tags.push(tag);
    if (!tag.close && (name === 'script' || name === 'style')) {
      const closeAt = html.toLowerCase().indexOf(`</${name}`, re.lastIndex);
      const body = html.slice(re.lastIndex, closeAt < 0 ? html.length : closeAt);
      if (name === 'style') text.push({ at: re.lastIndex, text: '' });
      (tag as Tag & { body?: string }).body = body;
      re.lastIndex = closeAt < 0 ? html.length : closeAt;
      last = re.lastIndex;
    }
  }
  if (last < html.length) text.push({ at: last, text: html.slice(last) });
  return { tags, text };
}

// ---------- WCAG 2.x contrast ----------
export function parseColor(s: string): [number, number, number] | null {
  const t = s.trim().toLowerCase();
  const named: Record<string, string> = { white: '#ffffff', black: '#000000', red: '#ff0000', grey: '#808080', gray: '#808080', silver: '#c0c0c0', yellow: '#ffff00', blue: '#0000ff', green: '#008000' };
  const v = named[t] ?? t;
  let m = /^#([0-9a-f]{3})$/.exec(v);
  if (m) return [0, 1, 2].map((i) => parseInt(m![1][i] + m![1][i], 16)) as [number, number, number];
  m = /^#([0-9a-f]{6})$/.exec(v);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as [number, number, number];
  m = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(v);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])].map((x) => Math.min(255, x)) as [number, number, number];
  return null;
}
export function luminance([r, g, b]: [number, number, number]): number {
  const c = (x: number) => { const s = x / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
export function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const styleProp = (style: string, prop: string) => {
  const m = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i').exec(style);
  return m ? m[1].trim() : null;
};

export function inspect(html: string): WebFinding[] {
  const { tags, text } = tokenize(html);
  const out: WebFinding[] = [];
  const add = (rule: WebRule, t: Tag | null, detail?: string) => out.push({ rule, line: t?.line ?? 1, snippet: t?.raw ?? '', detail });
  const textBetween = (from: number, to: number) => text.filter((x) => x.at >= from && x.at < to).map((x) => x.text).join('').replace(/&nbsp;/g, ' ').trim();
  const closeIndex = (t: Tag, i: number) => {
    let depth = 0;
    for (let j = i + 1; j < tags.length; j++) {
      if (tags[j].name !== t.name) continue;
      if (!tags[j].close && !tags[j].selfClose) depth++;
      else if (tags[j].close) { if (depth === 0) return j; depth--; }
    }
    return -1;
  };
  const labelFor = new Set(tags.filter((t) => t.name === 'label' && !t.close && t.attrs.for).map((t) => t.attrs.for));
  const ids = new Map<string, number>();
  let labelDepth = 0;
  const headings: { level: number; tag: Tag }[] = [];
  tags.forEach((t, i) => {
    if (t.name === 'label') { labelDepth += t.close ? -1 : 1; labelDepth = Math.max(0, labelDepth); }
    if (t.close) return;
    const a = t.attrs;
    // ---- security ----
    if (t.name === 'script') add('script', t);
    for (const k of Object.keys(a)) if (/^on[a-z]+$/.test(k)) add('eventHandler', t, k);
    for (const k of ['href', 'src', 'action', 'formaction', 'xlink:href']) if (a[k] !== undefined && /^\s*javascript:/i.test(a[k].replace(/[\s\u0000-\u001f]/g, ''))) add(k === 'action' || k === 'formaction' ? 'formJsAction' : 'jsUrl', t, k);
    if (t.name === 'iframe' && a.sandbox === undefined) add('iframeNoSandbox', t);
    if (a.srcdoc !== undefined) add('srcdoc', t);
    if (t.name === 'object' || t.name === 'embed') add('objectEmbed', t);
    if (t.name === 'a' && (a.target ?? '').toLowerCase() === '_blank' && !/\bnoopener\b|\bnoreferrer\b/i.test(a.rel ?? '')) add('blankNoopener', t);
    if (a.style && /expression\s*\(|url\s*\(\s*['"]?\s*javascript:/i.test(a.style)) add('cssExpression', t);
    if (t.name === 'meta' && (a['http-equiv'] ?? '').toLowerCase() === 'refresh' && /url\s*=\s*javascript:/i.test(a.content ?? '')) add('jsUrl', t, 'meta refresh');
    // ---- accessibility ----
    if (t.name === 'html' && !(a.lang ?? '').trim()) add('htmlLang', t);
    if (t.name === 'img' && a.alt === undefined && a.role !== 'presentation') add('imgAlt', t);
    if ((t.name === 'input' && !['hidden', 'submit', 'button', 'reset', 'image'].includes((a.type ?? 'text').toLowerCase())) || t.name === 'select' || t.name === 'textarea') {
      const named = (a['aria-label'] ?? '').trim() || (a['aria-labelledby'] ?? '').trim() || (a.title ?? '').trim();
      if (!named && labelDepth === 0 && !(a.id && labelFor.has(a.id))) add('inputLabel', t);
    }
    const h = /^h([1-6])$/.exec(t.name);
    if (h) headings.push({ level: Number(h[1]), tag: t });
    if (t.name === 'button' || t.name === 'a') {
      const ci = closeIndex(t, i);
      const inner = ci > 0 ? textBetween(t.end, tags[ci].index) : '';
      const innerImgAlt = ci > 0 ? tags.slice(i + 1, ci).some((x) => x.name === 'img' && (x.attrs.alt ?? '').trim()) : false;
      const name = inner || (a['aria-label'] ?? '').trim() || (a.title ?? '').trim() || innerImgAlt;
      if (!name) add(t.name === 'button' ? 'emptyButton' : 'emptyLink', t);
    }
    if (a.id) { if (ids.has(a.id)) add('dupId', t, a.id); else ids.set(a.id, i); }
    if (a.tabindex !== undefined && Number(a.tabindex) > 0) add('tabindex', t, a.tabindex);
    if (a.style) {
      const fg = styleProp(a.style, 'color'), bg = styleProp(a.style, 'background-color') ?? styleProp(a.style, 'background');
      const cf = fg ? parseColor(fg) : null, cb = bg ? parseColor(bg) : null;
      if (cf && cb) {
        const r = contrastRatio(cf, cb);
        if (r < 4.5) add('contrast', t, r.toFixed(2) + ':1');
      }
    }
  });
  const h1 = headings.filter((x) => x.level === 1);
  if (tags.some((t) => t.name === 'body' || t.name === 'main' || headings.length) && !h1.length) add('noH1', headings[0]?.tag ?? null);
  if (h1.length > 1) add('manyH1', h1[1].tag);
  for (let i = 1; i < headings.length; i++) if (headings[i].level > headings[i - 1].level + 1) add('headingSkip', headings[i].tag, `h${headings[i - 1].level} → h${headings[i].level}`);
  return out.sort((x, y) => x.line - y.line || x.rule.localeCompare(y.rule));
}

// ---------- practice page (fictional shop) ----------
export const PRACTICE_HTML = `<!doctype html>
<html>
<head><title>Corner Bakery — order</title></head>
<body>
  <h2>Corner Bakery</h2>
  <img src="bread.jpg">
  <p style="color:#999999; background-color:#ffffff">Fresh bread every morning.</p>
  <form>
    <input type="text" id="name" placeholder="Your name">
    <label for="email">Email</label>
    <input type="email" id="email">
    <button onclick="send()"></button>
  </form>
  <a href="javascript:alert('hi')">Offers</a>
  <a href="https://example.org/map" target="_blank">Find us</a>
  <h4>Opening hours</h4>
  <script>document.write(location.hash)</script>
</body>
</html>
`;

export const WEB_PLANTED: { id: string; rule: WebRule }[] = [
  { id: 'lang', rule: 'htmlLang' },
  { id: 'h1', rule: 'noH1' },
  { id: 'alt', rule: 'imgAlt' },
  { id: 'contrast', rule: 'contrast' },
  { id: 'label', rule: 'inputLabel' },
  { id: 'handler', rule: 'eventHandler' },
  { id: 'button', rule: 'emptyButton' },
  { id: 'jsurl', rule: 'jsUrl' },
  { id: 'blank', rule: 'blankNoopener' },
  { id: 'skip', rule: 'headingSkip' },
  { id: 'script', rule: 'script' },
];

/** The fixed page must keep its content: a heading, the image, the form with two fields and a button, two links. */
export function keptContent(html: string): boolean {
  const { tags } = tokenize(html);
  const n = (name: string) => tags.filter((t) => t.name === name && !t.close).length;
  return /Corner Bakery/.test(html) && n('img') >= 1 && n('form') >= 1 && n('input') >= 2 && n('button') >= 1 && n('a') >= 2;
}

export function gradeWebPractice(html: string): { checks: { id: string; ok: boolean }[]; findings: WebFinding[] } {
  const findings = inspect(html);
  const kept = keptContent(html);
  const checks = WEB_PLANTED.map((p) => ({ id: p.id, ok: kept && !findings.some((f) => f.rule === p.rule) }));
  checks.push({ id: 'kept', ok: kept });
  checks.push({ id: 'clean', ok: kept && findings.length === 0 });
  return { checks, findings };
}

/**
 * Copy of the page for the preview pane: scripts, inline handlers and javascript: URLs removed.
 * The preview iframe is ALSO sandboxed with no permissions; this is a second layer, not the only one.
 */
export function previewCopy(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?(<\/script\s*>|$)/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|action|formaction)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi, '$1="#"')
    .replace(/<(iframe|object|embed)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, '');
}
