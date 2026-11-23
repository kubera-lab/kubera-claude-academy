// Runs learner JavaScript for real, inside a disposable Web Worker with a time limit.
// The worker has no access to the page, cookies or local storage, and is terminated after each run.
import { evaluateCode, type CodeRun, type CodeTest } from '../engine/grade.ts';

const WORKER_SRC = `const evaluateCode = ${evaluateCode.toString()};
self.onmessage = (e) => { const d = e.data; self.postMessage(evaluateCode(d.src, d.fnName, d.tests)); };`;

export function runInWorker(src: string, fnName: string, tests: CodeTest[], timeoutMs = 2000): Promise<{ compileError?: string; runs: CodeRun[] } | 'timeout'> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const w = new Worker(url);
    const done = (v: { compileError?: string; runs: CodeRun[] } | 'timeout') => {
      clearTimeout(timer);
      w.terminate();
      URL.revokeObjectURL(url);
      resolve(v);
    };
    const timer = setTimeout(() => done('timeout'), timeoutMs);
    w.onmessage = (e) => done(e.data);
    w.onerror = (e) => { e.preventDefault(); done({ compileError: e.message || 'error', runs: [] }); };
    w.postMessage({ src, fnName, tests: tests.map(({ id, args, expect, tol }) => ({ id, args, expect, tol })) });
  });
}
