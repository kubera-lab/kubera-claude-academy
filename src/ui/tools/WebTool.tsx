// Course 8 final project: HTML/CSS Security & Accessibility Inspector.
// The learner's HTML is previewed in a sandboxed iframe with NO script permission, so nothing in it can run.
import { useMemo, useState } from 'react';
import type { Lang } from '../../content/types.ts';
import type { GradeResult } from '../../engine/grade.ts';
import { AREA, PRACTICE_HTML, gradeWebPractice, inspect, previewCopy, type WebFinding, type WebRule } from '../../engine/tools/web.ts';
import { downloadText } from '../download.ts';
import { COMMON, Editor, FileLoad, LabChecks, l, toGrade, tr, type L } from './common.tsx';

const RULE: Record<WebRule, { name: L; fix: L }> = {
  script: { name: l('Inline <script>', 'Встроенный <script>'), fix: l('Move code to a separate file and never write untrusted input into the page (document.write, innerHTML).', 'Вынесите код в отдельный файл и не вставляйте недоверенный ввод в страницу (document.write, innerHTML).') },
  eventHandler: { name: l('Inline event handler (on…=)', 'Обработчик в атрибуте (on…=)'), fix: l('Use addEventListener in a script file; inline handlers are blocked by a strict Content Security Policy.', 'Используйте addEventListener в файле скрипта; встроенные обработчики блокирует строгая CSP.') },
  jsUrl: { name: l('javascript: URL', 'Ссылка javascript:'), fix: l('Links must point to real addresses (https://… or /path).', 'Ссылки должны вести на реальные адреса (https://… или /путь).') },
  iframeNoSandbox: { name: l('<iframe> without sandbox', '<iframe> без sandbox'), fix: l('Add the sandbox attribute and allow only what is needed.', 'Добавьте атрибут sandbox и разрешайте только нужное.') },
  srcdoc: { name: l('srcdoc attribute', 'Атрибут srcdoc'), fix: l('Embedded HTML in srcdoc can carry scripts; avoid it or sandbox it.', 'HTML в srcdoc может содержать скрипты; избегайте или изолируйте его.') },
  objectEmbed: { name: l('<object> / <embed>', '<object> / <embed>'), fix: l('Plugin content is a common attack path; use normal HTML elements.', 'Содержимое плагинов — частый путь атаки; используйте обычные элементы HTML.') },
  blankNoopener: { name: l('target="_blank" without rel="noopener"', 'target="_blank" без rel="noopener"'), fix: l('Add rel="noopener noreferrer" so the new tab cannot control this page.', 'Добавьте rel="noopener noreferrer", чтобы новая вкладка не управляла этой страницей.') },
  cssExpression: { name: l('Script inside CSS', 'Скрипт внутри CSS'), fix: l('Remove expression() and javascript: from styles.', 'Уберите expression() и javascript: из стилей.') },
  formJsAction: { name: l('Form action is javascript:', 'action формы — javascript:'), fix: l('Send the form to a real address.', 'Отправляйте форму на реальный адрес.') },
  metaRefresh: { name: l('Redirect to javascript:', 'Переадресация на javascript:'), fix: l('Remove the refresh.', 'Уберите переадресацию.') },
  imgAlt: { name: l('Image without alt', 'Картинка без alt'), fix: l('Describe the image in alt (or alt="" if it is only decoration).', 'Опишите картинку в alt (или alt="", если это только украшение).') },
  inputLabel: { name: l('Form field without a label', 'Поле формы без подписи'), fix: l('Add <label for="id"> (a placeholder is not a label).', 'Добавьте <label for="id"> (placeholder — не подпись).') },
  noH1: { name: l('No <h1> heading', 'Нет заголовка <h1>'), fix: l('Start the page with one <h1> that names it.', 'Начните страницу с одного <h1> с её названием.') },
  manyH1: { name: l('More than one <h1>', 'Больше одного <h1>'), fix: l('Keep one main heading; use <h2> for sections.', 'Оставьте один главный заголовок; разделы — <h2>.') },
  headingSkip: { name: l('Heading level skipped', 'Пропущен уровень заголовка'), fix: l('Go down one level at a time: h1 → h2 → h3.', 'Спускайтесь по одному уровню: h1 → h2 → h3.') },
  htmlLang: { name: l('Page language not set', 'Не указан язык страницы'), fix: l('Add lang="en" (or the right language) to <html>.', 'Добавьте lang="en" (или нужный язык) в <html>.') },
  emptyButton: { name: l('Button without a name', 'Кнопка без названия'), fix: l('Put text inside the button or add aria-label.', 'Добавьте текст в кнопку или aria-label.') },
  emptyLink: { name: l('Link without text', 'Ссылка без текста'), fix: l('Put meaningful text inside the link.', 'Добавьте в ссылку понятный текст.') },
  dupId: { name: l('Duplicate id', 'Повтор id'), fix: l('Each id must be unique on the page.', 'Каждый id на странице должен быть уникальным.') },
  tabindex: { name: l('Positive tabindex', 'Положительный tabindex'), fix: l('Use tabindex="0" or the natural order; positive values break keyboard order.', 'Используйте tabindex="0" или естественный порядок; положительные значения ломают порядок клавиатуры.') },
  contrast: { name: l('Low text contrast', 'Низкий контраст текста'), fix: l('Normal text needs at least 4.5:1 (WCAG 2.2 AA). Make the text darker or the background lighter.', 'Обычному тексту нужно не меньше 4.5:1 (WCAG 2.2 AA). Сделайте текст темнее или фон светлее.') },
};

const LAB: Record<string, L> = {
  lang: l('Page language set', 'Язык страницы указан'),
  h1: l('Page has an <h1>', 'На странице есть <h1>'),
  alt: l('Image has alt text', 'У картинки есть alt'),
  contrast: l('Text contrast at least 4.5:1', 'Контраст текста не меньше 4.5:1'),
  label: l('Name field has a label', 'У поля «имя» есть подпись'),
  handler: l('No inline event handler', 'Нет обработчика в атрибуте'),
  button: l('Button has a name', 'У кнопки есть название'),
  jsurl: l('No javascript: link', 'Нет ссылки javascript:'),
  blank: l('New-tab link has rel="noopener"', 'Ссылка в новой вкладке с rel="noopener"'),
  skip: l('Headings do not skip levels', 'Заголовки без пропуска уровней'),
  script: l('No inline script that writes untrusted input', 'Нет встроенного скрипта, который вставляет недоверенный ввод'),
  kept: l('Page content kept: heading, image, form with 2 fields and a button, 2 links', 'Содержимое сохранено: заголовок, картинка, форма с 2 полями и кнопкой, 2 ссылки'),
  clean: COMMON.clean,
};

const SCOPE = l(
  'This inspector checks a fixed list of common rules. A clean result does NOT prove the page is safe from XSS or conforms to WCAG: test with real users, a keyboard, a screen reader and a security review.',
  'Инспектор проверяет фиксированный список частых правил. Чистый результат НЕ доказывает защиту от XSS или соответствие WCAG: проверяйте с реальными людьми, клавиатурой, программой чтения экрана и проверкой безопасности.',
);

function md(file: string, f: WebFinding[], lang: Lang, when: Date) {
  return [
    `# Web quality audit — ${file}`, '',
    `Checked on ${when.toISOString().slice(0, 10)} with the KUBERA Claude Academy Web Quality Inspector.`, '',
    `- Security findings: ${f.filter((x) => AREA[x.rule] === 'security').length}`,
    `- Accessibility findings: ${f.filter((x) => AREA[x.rule] === 'a11y').length}`, '',
    f.length ? '| Line | Area | Problem | Code | How to fix |\n| --- | --- | --- | --- | --- |' : '_No problems found by these rules._',
    ...f.map((x) => `| ${x.line} | ${AREA[x.rule]} | ${tr(RULE[x.rule].name, lang)}${x.detail ? ' (' + x.detail + ')' : ''} | \`${x.snippet.replace(/\|/g, '\\|').replace(/`/g, "'")}\` | ${tr(RULE[x.rule].fix, lang)} |`),
    '', `_${SCOPE.en}_`, '',
  ].join('\n');
}

export default function WebTool({ lang, answer: saved, onAnswer, onGraded }: { lang: Lang; answer: string | null; onAnswer: (a: string) => void; onGraded: (r: GradeResult) => void }) {
  const answer = saved ?? PRACTICE_HTML;
  const [fileName, setFileName] = useState('practice.html');
  const [msg, setMsg] = useState('');
  const [shown, setShown] = useState(false);
  const findings = useMemo(() => inspect(answer), [answer]);
  const lab = useMemo(() => gradeWebPractice(answer), [answer]);
  const own = fileName !== 'practice.html';
  const save = (name: string, text: string, type: string) => setMsg(tr(downloadText(name, text, type) ? COMMON.exported : COMMON.exportFail, lang));
  const base = fileName.replace(/\.html?$/i, '');
  const when = new Date();
  return (
    <div className="tool" data-testid="tool-web">
      <p className="note small">{tr(SCOPE, lang)}</p>
      <div className="row">
        <FileLoad accept=".html,.htm,text/html" lang={lang} label={COMMON.loadFile} onText={(t, n) => { onAnswer(t); setFileName(n); setShown(true); }} />
        <button type="button" onClick={() => { onAnswer(PRACTICE_HTML); setFileName('practice.html'); }}>{tr(COMMON.sample, lang)}</button>
      </div>
      {own && <p className="note">{tr(COMMON.ownData, lang)}</p>}
      <Editor id="web-editor" label={lang === 'ru' ? `HTML (${fileName}) — исправляйте прямо здесь` : `HTML (${fileName}) — fix it right here`} value={answer} onChange={onAnswer} rows={16} />
      <div className="row">
        <button className="primary" onClick={() => setShown(true)}>{tr(COMMON.audit, lang)}</button>
        {!own && <button onClick={() => { setShown(true); onAnswer(answer); onGraded(toGrade(lab.checks, answer)); }}>{tr(COMMON.check, lang)}</button>}
      </div>
      {shown && (
        <section aria-live="polite" data-testid="web-results">
          <p><b>{lang === 'ru' ? 'Безопасность' : 'Security'}: {findings.filter((x) => AREA[x.rule] === 'security').length}</b> · <b>{lang === 'ru' ? 'Доступность' : 'Accessibility'}: {findings.filter((x) => AREA[x.rule] === 'a11y').length}</b></p>
          {findings.length === 0 ? <p className="good">{tr(COMMON.noFindings, lang)}</p> : (
            <div className="tablewrap">
              <table className="tbl">
                <thead><tr><th>{lang === 'ru' ? 'Строка' : 'Line'}</th><th>{lang === 'ru' ? 'Область' : 'Area'}</th><th>{lang === 'ru' ? 'Проблема' : 'Problem'}</th><th>{lang === 'ru' ? 'Код' : 'Code'}</th><th>{lang === 'ru' ? 'Как исправить' : 'How to fix'}</th></tr></thead>
                <tbody>
                  {findings.map((x, i) => (
                    <tr key={i}><td>{x.line}</td><td>{AREA[x.rule] === 'security' ? (lang === 'ru' ? 'безопасность' : 'security') : (lang === 'ru' ? 'доступность' : 'accessibility')}</td><td>{tr(RULE[x.rule].name, lang)}{x.detail ? ` (${x.detail})` : ''}</td><td className="mono small">{x.snippet}</td><td className="small">{tr(RULE[x.rule].fix, lang)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h3>{lang === 'ru' ? 'Просмотр (скрипты удалены и отключены)' : 'Preview (scripts removed and disabled)'}</h3>
          <iframe title={lang === 'ru' ? 'Безопасный просмотр страницы' : 'Safe page preview'} sandbox="" srcDoc={previewCopy(answer)} className="webpreview" />
          <div className="row">
            <button onClick={() => save(base + '-audit.md', md(fileName, findings, lang, when), 'text/markdown')}>{lang === 'ru' ? 'Скачать аудит .md' : 'Download audit .md'}</button>
            <button onClick={() => save(base + '-audit.json', JSON.stringify({ tool: 'KUBERA Claude Academy — Web Quality Inspector', file: fileName, checked_at: when.toISOString(), findings: findings.map((x) => ({ ...x, area: AREA[x.rule] })), scope: SCOPE.en }, null, 2), 'application/json')}>{lang === 'ru' ? 'Скачать аудит .json' : 'Download audit .json'}</button>
            <button onClick={() => save(base + '-fixed.html', answer, 'text/html')}>{lang === 'ru' ? 'Скачать исправленный .html' : 'Download fixed .html'}</button>
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
