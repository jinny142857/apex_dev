'use client';

import { useLanguage } from './LanguageProvider';
import { emptySelfAssessment, selfAssessmentItems, type OutcomeSelfAssessment } from '@/lib/outcome-self-assessment';

export default function OutcomeSelfAssessment({ value, onChange, idPrefix }: { value?: Partial<OutcomeSelfAssessment>; onChange: (value: OutcomeSelfAssessment) => void; idPrefix: string }) {
  const { tr } = useLanguage();
  const scores = { ...emptySelfAssessment, ...value };
  const completed = selfAssessmentItems.filter(({ key }) => Number.isInteger(scores[key]) && Number(scores[key]) >= 1 && Number(scores[key]) <= 10).length;
  return <section className="outcome-self-assessment" aria-labelledby={`${idPrefix}-self-assessment-title`}>
    <div className="outcome-self-assessment-heading"><div><span className="eyebrow">{tr('BEFORE YOU PUBLISH')}</span><h4 id={`${idPrefix}-self-assessment-title`}>{tr('Quick self-check')}</h4><p>{tr('Rate your finished app on each point. Use a whole number from 1 to 10.')}</p></div><div className="outcome-score-status"><strong aria-live="polite">{completed} / 5 {tr('scored')}</strong><span className="outcome-score-scale">{tr('1 = not yet addressed · 10 = addressed well')}</span></div></div>
    <div className="outcome-score-list">{selfAssessmentItems.map(({ key, title, description }, index) => <div className="outcome-score-row" key={key}>
      <span className="outcome-score-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div className="outcome-score-copy"><label htmlFor={`${idPrefix}-${key}`}>{tr(title)}</label><p>{tr(description)}</p></div>
      <div className="outcome-score-input"><input id={`${idPrefix}-${key}`} type="text" inputMode="numeric" pattern="(?:[1-9]|10)" maxLength={2} required aria-invalid={scores[key] !== null && (!Number.isInteger(scores[key]) || Number(scores[key]) < 1 || Number(scores[key]) > 10)} aria-label={`${tr(title)}: ${tr('score from 1 to 10')}`} value={scores[key] ?? ''} onChange={event => { if (/^\d{0,2}$/.test(event.target.value)) onChange({ ...scores, [key]: event.target.value === '' ? null : Number(event.target.value) }); }}/><span>/ 10</span></div>
    </div>)}</div>
  </section>;
}
