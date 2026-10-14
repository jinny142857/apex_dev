'use client';

import { useEffect, useState } from 'react';
import { preworkExamples } from '@/lib/prework-examples';
import { useLanguage } from './LanguageProvider';

type Props = { currentProblem: string; onImport: (problem: string) => void; onClose: () => void };

export default function PreworkReferenceDialog({ currentProblem, onImport, onClose }: Props) {
  const { tr } = useLanguage();
  const [selected, setSelected] = useState(0);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const example = preworkExamples[selected];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function requestImport() {
    if (currentProblem.trim() && currentProblem.trim() !== example.problemStatement) {
      setConfirmReplace(true);
      return;
    }
    onImport(example.problemStatement);
  }

  return <div className="prd-reference-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="prd-reference-dialog" role="dialog" aria-modal="true" aria-labelledby="prd-reference-title" aria-describedby="prd-reference-help">
      <div className="prd-reference-header"><div><span className="eyebrow">{tr('PROBLEM REFERENCES')}</span><h2 id="prd-reference-title">{tr('Choose a starting problem')}</h2><p id="prd-reference-help">{tr('Browse examples, then bring one sentence into Your problem. You can edit it afterward.')}</p></div><button type="button" className="prd-reference-close" onClick={onClose} aria-label={tr('Close references')}>×</button></div>
      <div className="prd-reference-body">
        <div className="prd-reference-list" role="group" aria-label={tr('Problem examples')}>
          {preworkExamples.map((item, index) => <button type="button" key={item.title} aria-pressed={selected === index} className={selected === index ? 'selected' : ''} onClick={() => { setSelected(index); setConfirmReplace(false); }}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><span aria-hidden="true">→</span></button>)}
        </div>
        <div className="prd-reference-preview"><span className="eyebrow">{tr('PREVIEW')}</span><h3>{example.title}</h3><p>{example.problemStatement}</p><small>{tr('Only the problem sentence changes. Check User afterward; app ideas and features stay as they are.')}</small>
          {confirmReplace && <div className="prd-reference-confirm" role="alert"><strong>{tr('Replace your current problem?')}</strong><p>{tr('Your current problem sentence will be replaced. The other PRD fields will stay as they are.')}</p><div><button type="button" className="secondary" onClick={() => setConfirmReplace(false)}>{tr('Keep my problem')}</button><button type="button" onClick={() => onImport(example.problemStatement)}>{tr('Replace problem')}</button></div></div>}
          {!confirmReplace && <button type="button" className="prd-reference-use" onClick={requestImport}>{tr('Use this problem')} →</button>}
        </div>
      </div>
    </section>
  </div>;
}
