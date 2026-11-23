// Course content model. Content is data: no UI code here, so lessons can be versioned and tested.
import type { CodeTest } from '../engine/grade.ts';

export type Lang = 'en' | 'ru';
export interface L {
  en: string;
  ru: string;
}
export const tx = (v: L, lang: Lang) => v[lang] || v.en;

/** Content version. Bump a lesson's `v` when its exercise changes: older passes for it stop counting. */
export const CONTENT_VERSION = '1.1.0';
export const CHECKED = '2026-11-16';

export interface Source {
  title: string;
  url: string;
  org: string;
  /** Why the lesson links to it. */
  purpose: L;
  /** Licence of the source. We link and paraphrase; we do not copy text. */
  license: string;
  checked: string;
}

export interface ChoiceQ {
  id: string;
  prompt: L;
  options: L[];
  correct: number;
  why: L;
}

export type ToolId = 'csv' | 'sqlreport' | 'geojson' | 'web' | 'safety' | 'abtest' | 'trace';

export type Exercise =
  /** warmup: explanations are shown right after the first check (practice before the lab). */
  | { kind: 'choice'; questions: ChoiceQ[]; warmup?: boolean }
  | {
      kind: 'classify';
      intro: L;
      labels: { id: string; label: L }[];
      items: { id: string; text: L; correct: string; why: L; evidence?: { minWords: number; anyOf: string[] } }[];
    }
  | { kind: 'order'; intro: L; steps: { id: string; text: L }[]; correct: string[]; why: L }
  | { kind: 'numeric'; task: L; answer: number; tolerance: number; unit: string; why: L }
  | {
      kind: 'sql';
      task: L;
      schema: L;
      /** Visible dataset and a hidden variant used to catch hard-coded answers. */
      datasets: { id: string; setup: string }[];
      reference: string;
      orderMatters: boolean;
      starter: string;
      hint: L;
    }
  | { kind: 'code'; task: L; fnName: string; starter: string; tests: (CodeTest & { label: L })[]; reference: string; hint: L }
  | { kind: 'prompt'; task: L; subject: string; starter: string }
  | { kind: 'manual'; task: L; checklist: L[]; minWords: number }
  /** A full practical tool (course final project): audit, fix, re-check and export. */
  | { kind: 'tool'; tool: ToolId; task: L };

export interface Lesson {
  id: string;
  v: number;
  title: L;
  minutes: number;
  /** Plain-language explanation, one paragraph per item. */
  explain: L[];
  example: L;
  sources: Source[];
  exercise: Exercise;
  /** Labs are the practical project of a course. */
  lab?: boolean;
}

export interface Course {
  id: string;
  n: number;
  title: L;
  level: L;
  summary: L;
  outcome: L;
  /** The original course with its own pages (m1–m5 + project). */
  legacy?: boolean;
  /** Key terms for absolute beginners, in English and Russian. */
  glossary?: { term: L; def: L }[];
  lessons: Lesson[];
}
