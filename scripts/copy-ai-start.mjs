// После сборки академии кладём школу KUBERA AI START (статичные файлы, без сборки) в dist/ai-start/.
import { cpSync, mkdirSync } from 'node:fs';
const out = 'dist/ai-start';
mkdirSync(out, { recursive: true });
for (const p of ['index.html', 'css', 'js', 'data']) cpSync(`ai-start/${p}`, `${out}/${p}`, { recursive: true });
console.log('KUBERA AI START copied to', out);
