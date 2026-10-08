export const teams = ['A', 'B', 'C', 'D'] as const;
export type Team = typeof teams[number];
export type Criterion = { id: string; label: string; maxScore: number };
export type ReviewFeedback = { strength: string; suggestion: string };
export type ScoreSheet = { scores: Record<string, Record<string, number>>; feedback?: Record<string, ReviewFeedback> };
export type EvaluationConfig = {
  phase: 'setup' | 'team' | 'final' | 'closed';
  assignments: Record<string, Team>;
  finalists: Partial<Record<Team, string>>;
  finalRubric: Criterion[];
  presentationOrder?: Team[];
  finalDeadline?: string;
  teamResultsPublished?: boolean;
  finalResultsPublished?: boolean;
  winnerTeamId?: Team;
};

export const initialEvaluation: EvaluationConfig = {
  phase: 'setup', assignments: {}, finalists: {}, finalRubric: [],
};

export function validateRubric(value: unknown): Criterion[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) throw new Error('Add 1–10 rubric criteria.');
  const rubric = value.map((item, index) => ({ id: `criterion-${index + 1}`, label: String(item?.label || '').trim(), maxScore: Number(item?.maxScore) }));
  if (rubric.some(item => !item.label || item.label.length > 100 || !Number.isInteger(item.maxScore) || item.maxScore < 1 || item.maxScore > 100)) throw new Error('Each criterion needs a label and a maximum score from 1 to 100.');
  return rubric;
}

export function validateSheet(value: unknown, candidates: string[], rubric: Criterion[]): ScoreSheet {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Complete the score sheet.');
  const scores = value as Record<string, Record<string, number>>;
  if (Object.keys(scores).length !== candidates.length || candidates.some(id => !scores[id])) throw new Error('Score every eligible candidate.');
  for (const id of candidates) {
    if (Object.keys(scores[id]).length !== rubric.length) throw new Error('Complete every rubric criterion.');
    for (const criterion of rubric) {
      const score = scores[id][criterion.id];
      if (!Number.isInteger(score) || score < 1 || score > criterion.maxScore) throw new Error(`Enter a whole-number score from 1 to ${criterion.maxScore} for ${criterion.label}.`);
    }
  }
  return { scores };
}

export function validateFeedback(value: unknown, candidates: string[]): Record<string, ReviewFeedback> {
  const entries = (value && typeof value === 'object' && !Array.isArray(value)) ? value as Record<string, ReviewFeedback> : {};
  return Object.fromEntries(candidates.map(id => {
    const strength = String(entries[id]?.strength || '').trim();
    const suggestion = String(entries[id]?.suggestion || '').trim();
    if (strength.length > 1000 || suggestion.length > 1000) throw new Error('Keep feedback under 1,000 characters.');
    return [id, { strength, suggestion }];
  }));
}

export function rankings(ids: string[], sheets: ScoreSheet[], rubric: Criterion[]) {
  const maxScore = rubric.reduce((sum, criterion) => sum + criterion.maxScore, 0);
  return ids.map(id => {
    const totals = sheets.map(sheet => sheet.scores?.[id]).filter(Boolean).map(scores => rubric.reduce((sum, criterion) => sum + (Number(scores[criterion.id]) || 0), 0));
    const total = totals.reduce((sum, score) => sum + score, 0);
    return { id, average: totals.length ? total / totals.length : 0, total, reviews: totals.length, maxScore };
  }).sort((a, b) => b.average - a.average || b.reviews - a.reviews || a.id.localeCompare(b.id));
}
