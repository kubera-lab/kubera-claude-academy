// Knowledge checks (multiple choice and labelling). Deterministic.
export interface ChoiceQuestion {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  why: string;
}
export interface QuizResult {
  score: number;
  total: number;
  wrongIds: string[];
  perQuestion: Record<string, 'correct' | 'wrong' | 'missing'>;
}

export function gradeChoices(qs: ChoiceQuestion[], answers: Record<string, number | undefined>): QuizResult {
  const perQuestion: QuizResult['perQuestion'] = {};
  let score = 0;
  const wrongIds: string[] = [];
  for (const q of qs) {
    const a = answers[q.id];
    if (a === undefined) {
      perQuestion[q.id] = 'missing';
      wrongIds.push(q.id);
    } else if (a === q.correct) {
      perQuestion[q.id] = 'correct';
      score++;
    } else {
      perQuestion[q.id] = 'wrong';
      wrongIds.push(q.id);
    }
  }
  return { score, total: qs.length, wrongIds, perQuestion };
}
