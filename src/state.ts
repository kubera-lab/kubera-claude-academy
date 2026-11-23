import { useEffect, useState } from 'react';
import type { ModuleId } from './data/course.ts';
import { RIVERSIDE, RIVERSIDE_KB, brokenRiverside, TEMPLATES } from './data/course.ts';
import type { AssistantConfig } from './engine/assistant.ts';
import type { Project } from './engine/project.ts';
import { hashOf, type Outcome } from './engine/grade.ts';
import type { Lang } from './content/types.ts';

export interface ModuleProgress {
  answers: Record<string, number>;
  quizChecked: boolean;
  quizScore: number;
  quizTotal: number;
  wrong: string[];
  attempts: number;
  practicePassed: boolean;
}
export interface LessonResult {
  outcome: Outcome;
  score: number;
  total: number;
  /** Fingerprint of the graded answer; the pass counts only while the answer is unchanged. */
  hash: string;
  /** Lesson content version that was graded. */
  v: number;
  at: string;
  /** Message keys per item, e.g. { r2: ['g.evidenceJunk'] } */
  items: { id: string; ok: boolean; reasons: string[] }[];
}
export interface LessonProgress {
  answer: unknown;
  attempts: number;
  result?: LessonResult;
}
export interface HistoryEvent {
  at: string;
  id: string;
  outcome: Outcome;
  score: number;
  total: number;
}
export interface AppState {
  v: 3;
  lang: Lang;
  lessons: Record<string, LessonProgress>;
  history: HistoryEvent[];
  modules: Record<ModuleId, ModuleProgress>;
  spot: Record<number, string>;
  m2Instructions: string;
  m3: AssistantConfig;
  m4: AssistantConfig;
  m4Pasted: Record<string, string>;
  m4ModelName: string;
  project: Project;
  projectCheck: { met: number; total: number; at: string } | null;
}

const KEY = 'kubera-ai-academy-v3';
const OLD_KEY = 'kubera-ai-academy-v2';

const emptyModule = (): ModuleProgress => ({ answers: {}, quizChecked: false, quizScore: 0, quizTotal: 0, wrong: [], attempts: 0, practicePassed: false });

export function initialState(): AppState {
  const lib = TEMPLATES[0];
  return {
    v: 3,
    lang: 'en',
    lessons: {},
    history: [],
    modules: { m1: emptyModule(), m2: emptyModule(), m3: emptyModule(), m4: emptyModule(), m5: emptyModule() },
    spot: {},
    m2Instructions: '',
    m3: { ...RIVERSIDE, kb: RIVERSIDE_KB.slice(0, 3).map((e) => ({ ...e })) },
    m4: brokenRiverside(),
    m4Pasted: {},
    m4ModelName: '',
    project: {
      subject: lib.subject,
      config: { name: '', purpose: '', instructions: '', facts: lib.facts, kb: [], unknownReply: '', outOfScopeTopics: '', outOfScopeReply: '', maxWords: 40 },
      tests: [],
      pasted: {},
      modelName: '',
    },
    projectCheck: null,
  };
}

export function storageAvailable(): boolean {
  try {
    const k = '__kaa_probe';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** Reads saved progress. v0.2 progress (course 3) is migrated, nothing is lost. */
export function parseSaved(raw: string | null, oldRaw: string | null): AppState {
  const base = initialState();
  try {
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.v === 3) return { ...base, ...parsed, modules: { ...base.modules, ...parsed.modules }, lessons: parsed.lessons ?? {}, history: parsed.history ?? [] };
    }
    if (oldRaw) {
      const old = JSON.parse(oldRaw) as Omit<AppState, 'v'> & { v: number };
      if (old.v === 2) return { ...base, ...old, v: 3, lang: 'en', lessons: {}, history: [], modules: { ...base.modules, ...old.modules } };
    }
  } catch {
    /* corrupted data: start fresh rather than crash */
  }
  return base;
}

function load(): AppState {
  try {
    return parseSaved(localStorage.getItem(KEY), localStorage.getItem(OLD_KEY));
  } catch {
    return initialState();
  }
}

/** A lesson counts as passed only for the exact answer and content version that were graded. */
export function lessonPassed(p: LessonProgress | undefined, version: number): boolean {
  return !!p?.result && p.result.outcome === 'passed' && p.result.v === version && p.result.hash === hashOf(p.answer);
}
export function lessonStale(p: LessonProgress | undefined, version: number): boolean {
  return !!p?.result && (p.result.v !== version || p.result.hash !== hashOf(p.answer));
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** What counts as "the submitted work" of the final project (pasted real-model replies are optional evidence, not the work). */
const projectWork = (p: AppState['project']) => ({ config: p.config, subject: p.subject, tests: p.tests });

/**
 * A pass belongs to one exact version of the work. If the work changes, the pass is removed
 * and the learner must check again. Pure function, unit-tested.
 * (Idea from the v0.2.1 review; pasted model replies are excluded so adding evidence does not erase a pass.)
 */
export function applyInvalidation(prev: AppState, next: AppState): AppState {
  const modules = { ...next.modules };
  let projectCheck = next.projectCheck;
  const drop = (id: ModuleId) => {
    if (modules[id].practicePassed) modules[id] = { ...modules[id], practicePassed: false };
  };
  if (!same(prev.spot, next.spot)) drop('m1');
  if (prev.m2Instructions !== next.m2Instructions) drop('m2');
  if (!same(prev.m3, next.m3)) drop('m3');
  if (!same(prev.m4, next.m4)) drop('m4');
  if (!same(projectWork(prev.project), projectWork(next.project))) {
    drop('m5');
    projectCheck = null;
  }
  return { ...next, modules, projectCheck };
}

export function useAppState() {
  const [state, setRaw] = useState<AppState>(load);
  const setState: typeof setRaw = (update) =>
    setRaw((prev) => applyInvalidation(prev, typeof update === 'function' ? update(prev) : update));
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable: progress lives in memory only (shown on dashboard) */
    }
  }, [state]);
  const reset = () => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(OLD_KEY);
    } catch {
      /* ignore */
    }
    setState((s) => ({ ...initialState(), lang: s.lang }));
  };
  /** Restoring a backup replaces the whole state; it must not run invalidation against the current work. */
  const restore = (next: AppState) => setRaw(next);
  return { state, setState, reset, restore };
}

/** Learning history keeps the latest 300 graded attempts. */
export function withHistory(s: AppState, ev: Omit<HistoryEvent, 'at'>): AppState {
  return { ...s, history: [{ ...ev, at: new Date().toISOString() }, ...s.history].slice(0, 300) };
}
