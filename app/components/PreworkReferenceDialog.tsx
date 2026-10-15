'use client';

import { useEffect, useState } from 'react';
import { preworkCategories } from '@/lib/prework-examples';
import { useLanguage } from './LanguageProvider';

type Props = { currentProblem: string; onImport: (problem: string) => void; onClose: () => void };

export default function PreworkReferenceDialog({ currentProblem, onImport, onClose }: Props) {
  const { language, tr } = useLanguage();
  const [categoryIndex, setCategoryIndex] = useState<number | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const category = categoryIndex === null ? null : preworkCategories[categoryIndex];
  const example = category?.examples[exampleIndex];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function selectCategory(index: number) {
    setCategoryIndex(index);
    setExampleIndex(0);
    setConfirmReplace(false);
  }

  function requestImport() {
    if (!example) return;
    if (currentProblem.trim() && currentProblem.trim() !== example.problemStatement) {
      setConfirmReplace(true);
      return;
    }
    onImport(example.problemStatement);
  }

  return <div className="prd-reference-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="prd-reference-dialog" role="dialog" aria-modal="true" aria-labelledby="prd-reference-title" aria-describedby="prd-reference-help">
      <div className="prd-reference-header"><div><span className="eyebrow">{tr('PROBLEM REFERENCES')}</span><h2 id="prd-reference-title">{tr('Choose a starting problem')}</h2><p id="prd-reference-help">{tr('Choose a category, then bring one problem sentence into your draft.')}</p></div><button type="button" className="prd-reference-close" onClick={onClose} aria-label={tr('Close references')}>×</button></div>
      {category === null ? <div className="prd-reference-categories" role="group" aria-label={tr('Categories')}>
        {preworkCategories.map((item, index) => <button type="button" key={item.id} className="prd-reference-category" onClick={() => selectCategory(index)}>
          <span className="prd-reference-category-mark" aria-hidden="true">{item.id}</span>
          <span className="prd-reference-category-copy"><strong>{language === 'ko' ? item.nameKo : item.name}</strong><small>{language === 'ko' ? `${item.examples.length}개 문제` : `${item.examples.length} problems`}</small></span>
          <span className="prd-reference-category-arrow" aria-hidden="true">→</span>
        </button>)}
      </div> : <>
        <div className="prd-reference-section-bar"><button type="button" className="prd-reference-back" onClick={() => { setCategoryIndex(null); setConfirmReplace(false); }}>← {tr('All categories')}</button><strong>{language === 'ko' ? category.nameKo : category.name}</strong><span>{language === 'ko' ? `${category.examples.length}개 문제` : `${category.examples.length} problems`}</span></div>
        <div className="prd-reference-body">
          <div className="prd-reference-list" role="group" aria-label={tr('Problem examples')}>
            {category.examples.map((item, index) => <button type="button" key={item.id} aria-pressed={exampleIndex === index} className={exampleIndex === index ? 'selected' : ''} onClick={() => { setExampleIndex(index); setConfirmReplace(false); }}><span>{item.id}</span><strong>{item.title}</strong><span aria-hidden="true">→</span></button>)}
          </div>
          {example && <div className="prd-reference-preview"><span className="eyebrow">{tr('PROBLEM STATEMENT')}</span><h3>{example.title}</h3><p>{example.problemStatement}</p>
            {confirmReplace && <div className="prd-reference-confirm" role="alert"><strong>{tr('Replace your current problem?')}</strong><p>{tr('Your current problem sentence will be replaced. The other PRD fields will stay as they are.')}</p><div><button type="button" className="secondary" onClick={() => setConfirmReplace(false)}>{tr('Keep my problem')}</button><button type="button" onClick={() => onImport(example.problemStatement)}>{tr('Replace problem')}</button></div></div>}
            {!confirmReplace && <button type="button" className="prd-reference-use" onClick={requestImport}>{tr('Use this problem')} →</button>}
          </div>}
        </div>
      </>}
    </section>
  </div>;
}
