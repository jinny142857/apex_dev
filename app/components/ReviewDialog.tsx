'use client';

import type { Criterion, ReviewFeedback } from '@/lib/evaluation';
import { reviewRubric, scoreLabels } from '@/lib/review-rubric';

export default function ReviewDialog({ team, title, rubric, values, feedback, onScore, onFeedback, onClose }: {
  team: string;
  title: string;
  rubric: Criterion[];
  values: Record<string, string>;
  feedback: ReviewFeedback;
  onScore: (criterionId: string, value: string) => void;
  onFeedback: (field: keyof ReviewFeedback, value: string) => void;
  onClose: () => void;
}) {
  const total = rubric.reduce((sum, criterion) => sum + Number(values[criterion.id] || 0), 0);
  const complete = rubric.every(criterion => values[criterion.id]) && !!feedback.strength.trim() && !!feedback.suggestion.trim();
  return <div className="rating-backdrop" onClick={onClose}>
    <section className="rating-dialog review-dialog" role="dialog" aria-modal="true" aria-label={`Evaluate ${title}`} onClick={event => event.stopPropagation()}>
      <header><div><span className="eyebrow">TEAM {team} · PEER REVIEW</span><h3>{title}</h3><p>Score the pitch, then leave two constructive notes.</p></div><button className="secondary" onClick={onClose} aria-label="Close evaluation">×</button></header>
      <div className="rating-criteria">
        <div className="review-scale" aria-label="Rating scale">{scoreLabels.map((label, index) => <span key={label}><strong>{index + 1}</strong> {label}</span>)}</div>
        {rubric.map((criterion, index) => {
          const detail = criterion.maxScore === 5 ? reviewRubric.find(item => item.id === criterion.id && item.label === criterion.label) : undefined;
          const selected = Number(values[criterion.id] || 0);
          return <fieldset className="presentation-criterion" key={criterion.id}>
            <legend><span className="review-criterion-number">{String(index + 1).padStart(2, '0')}</span>{criterion.label}</legend>
            {detail && <p className="review-question">{detail.question}</p>}
            <div className="score-choice-row">{Array.from({ length: criterion.maxScore }, (_, point) => point + 1).map(point => <label key={point} title={detail?.descriptions[point - 1]}><input type="radio" name={`${team}-${criterion.id}`} checked={selected === point} onChange={() => onScore(criterion.id, String(point))}/><span>{point}</span></label>)}</div>
            {selected > 0 && detail && <p className="review-descriptor"><strong>{scoreLabels[selected - 1]}:</strong> {detail.descriptions[selected - 1]}</p>}
          </fieldset>;
        })}
        <div className="review-feedback-grid"><label>One strength<textarea maxLength={1000} placeholder="What is useful or promising?" value={feedback.strength} onChange={event => onFeedback('strength', event.target.value)}/></label><label>One suggestion<textarea maxLength={1000} placeholder="What practical change would help?" value={feedback.suggestion} onChange={event => onFeedback('suggestion', event.target.value)}/></label></div>
      </div>
      <footer><span className="review-total">{total} / {rubric.reduce((sum, criterion) => sum + criterion.maxScore, 0)} points</span><button className="secondary" onClick={onClose}>Continue later</button><button disabled={!complete} onClick={onClose}>Save review</button></footer>
    </section>
  </div>;
}
