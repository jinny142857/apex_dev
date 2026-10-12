'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { type Prd, stripProblemBrackets } from '@/lib/prd';

export type Idea = { appIdea: string; features: string[] };
export type AssistContext = { problem: string; who: string; goal: string; appIdea: string };
export type AssistResult = { goal?: string; ideas?: Idea[]; features?: string[] };

type Props = {
  value: Prd;
  onChange: (value: Prd) => void;
  prework: string;
  who: string;
  onSaveDraft: (value: Prd) => boolean;
  onPublish: () => void;
  onDownload: () => void;
  published: boolean;
  busy?: boolean;
  onAssist?: (mode: 'goal' | 'ideas' | 'features', context: AssistContext) => Promise<AssistResult>;
  demoIdeas?: boolean;
};

const sections = ['Your problem', 'Goal', 'App idea', 'Core features', 'Review & download'];

export default function ProblemPrdWizard({ value, onChange, prework, who, onSaveDraft, onPublish, onDownload, published, busy, onAssist, demoIdeas = false }: Props) {
  const { tr } = useLanguage();
  const [section, setSection] = useState(0);
  const [status, setStatus] = useState('');
  const [assistBusy, setAssistBusy] = useState(false);
  const [assistError, setAssistError] = useState('');
  const [goalSuggestion, setGoalSuggestion] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [featureSuggestion, setFeatureSuggestion] = useState<string[]>([]);
  const problem = stripProblemBrackets(value.problem || value.refinedProblem || prework);
  const goal = value.goal;
  const user = value.user || who;
  const features = value.features.split('\n').map(item => item.trim().replace(/^([-*]|\d+[.)])\s*/, '')).filter(Boolean);

  function update(key: keyof Prd, text: string) {
    onChange({ ...value, [key]: key === 'problem' ? stripProblemBrackets(text) : text });
    setStatus('');
    if (key === 'problem' || key === 'goal') { setIdeas([]); setGoalSuggestion(''); }
    if (key === 'appIdea') setFeatureSuggestion([]);
  }
  function normalized(): Prd {
    return { ...value, problem, user, goal, startingProblem: value.startingProblem || stripProblemBrackets(prework) };
  }
  function save() {
    const next = normalized();
    onChange(next);
    const ok = onSaveDraft(next);
    setStatus(tr(ok ? 'Draft saved on this device. You can return to it later.' : 'Could not save this draft. Please try again.'));
    return ok;
  }
  function next() {
    const ready = section === 0 ? problem.trim() : section === 1 ? goal.trim() : section === 2 ? value.appIdea.trim() : features.length > 0 && features.length <= 3;
    if (!ready) { setStatus(tr(section === 3 ? 'Write 1–3 core features to continue.' : 'Complete this field to continue.')); return; }
    if (save()) setSection(current => Math.min(4, current + 1));
  }
  function previous() { if (save()) setSection(current => Math.max(0, current - 1)); }
  function revisit(target: number) { if (save()) setSection(target); }
  async function assist(mode: 'goal' | 'ideas' | 'features') {
    if (!onAssist) return;
    setAssistBusy(true); setAssistError('');
    if (mode === 'ideas') setIdeas([]);
    try {
      const result = await onAssist(mode, { problem, who: user, goal: mode === 'goal' ? '' : goal, appIdea: mode === 'features' ? value.appIdea : '' });
      if (mode === 'goal') setGoalSuggestion(result.goal || '');
      if (mode === 'ideas') setIdeas(result.ideas || []);
      if (mode === 'features') setFeatureSuggestion(result.features || []);
      if (mode === 'ideas' && !result.ideas?.length) setAssistError(tr('No ideas came back. Please try again.'));
    } catch (error) { setAssistError(error instanceof Error ? error.message : tr('Could not generate ideas. Please try again.')); }
    finally { setAssistBusy(false); }
  }
  function chooseIdea(idea: Idea) {
    const next = { ...normalized(), appIdea: idea.appIdea, features: idea.features.slice(0, 3).join('\n') };
    onChange(next);
    setStatus(onSaveDraft(next) ? tr('Idea added to your draft. You can edit every field.') : tr('Could not save this draft. Please try again.'));
    setIdeas([]);
  }
  return <section className="editor-panel prd-flow">
    <div className="panel-heading"><div><p className="eyebrow">STEP 02 · YOUR CONTRIBUTION</p><h3>{tr('From problem to PRD')}</h3><p className="panel-subtitle">{tr('Move from a clear problem to a small app you can build.')}</p></div><span className="privacy-pill">{published ? tr('Published · editing') : tr('Private draft')}</span></div>
    <div className="prd-flow-meter" aria-label={tr('PRD progress')}><div className="prd-flow-meter-head"><strong>{tr(sections[section])}</strong><span>{section + 1} / {sections.length}</span></div><div className="prd-flow-track"><span style={{ width: `${((section + 1) / sections.length) * 100}%` }}/></div></div>
    {section > 0 && <div className="prd-flow-recap">{sections.slice(0, section).map((label, index) => <button type="button" key={label} onClick={() => revisit(index)}><span>✓ {tr(label)}</span><strong>{index === 0 ? problem : index === 1 ? goal : index === 2 ? value.appIdea : features.join('; ')}</strong><small>{tr('Edit')} ↗</small></button>)}</div>}
    <div className="prd-flow-current">
      {section === 0 && <><span className="eyebrow">01 · {tr('Your problem')}</span><h4>{tr('Check the problem you brought from Pre-work.')}</h4><p>{tr('Change it only if a clearer version will help you design the app.')}</p><label htmlFor="flow-problem">{tr('Your problem')}</label><textarea id="flow-problem" value={problem} onChange={event => update('problem', event.target.value)} placeholder={tr('Describe the challenge in one clear sentence.')}/></>}
      {section === 1 && <><span className="eyebrow">02 · {tr('Goal')}</span><h4>{tr('What should become easier for the user when this problem is addressed?')}</h4><p>{tr('Describe the change you want, not the app or its features.')}</p><textarea id="flow-goal" aria-label={tr('Goal')} value={goal} onChange={event => update('goal', event.target.value)} placeholder="e.g. Teachers can coordinate shared rooms with fewer messages and booking conflicts."/><div className="prd-flow-ai"><button type="button" className="secondary" disabled={assistBusy || !onAssist || problem.trim().length < 15} onClick={() => void assist('goal')}>✦ {tr('Suggest a goal')}</button><small>{demoIdeas ? tr('Demo suggestions only; no API call is made.') : tr('Your answers are sent to Upstage when you use AI help.')}</small></div>{goalSuggestion && <div className="prd-flow-suggestion"><p>{goalSuggestion}</p><button type="button" className="secondary" onClick={() => { update('goal', goalSuggestion); setGoalSuggestion(''); }}>{tr('Use this goal')}</button></div>}</>}
      {section === 2 && <><span className="eyebrow">03 · {tr('App idea')}</span><h4>{tr('What simple web app could help the user achieve this goal?')}</h4><p>{tr('Write one sentence, or choose an AI idea and edit it.')}</p><textarea id="flow-idea" aria-label={tr('App idea')} value={value.appIdea} onChange={event => update('appIdea', event.target.value)} placeholder="e.g. A simple room booking app that shows availability and lets teachers reserve a time slot."/><div className="prd-flow-ai"><button type="button" className="secondary" disabled={assistBusy || !onAssist || !goal.trim()} onClick={() => void assist('ideas')}>✦ {assistBusy ? tr('Thinking…') : tr('Get app ideas')}</button><small>{demoIdeas ? tr('Demo suggestions only; no API call is made.') : tr('Your problem and goal are sent to Upstage. Do not include real student information.')}</small></div>{ideas.length > 0 && <div className="prd-flow-ideas" aria-label={tr('Suggested app ideas')}>{ideas.map((idea, index) => <article key={`${idea.appIdea}-${index}`}><span>0{index + 1}</span><strong>{idea.appIdea}</strong><button type="button" className="secondary" onClick={() => chooseIdea(idea)}>{tr('Use this idea')}</button></article>)}</div>}</>}
      {section === 3 && <><span className="eyebrow">04 · {tr('Core features')}</span><h4>{tr('What are the 1–3 essential things the user must be able to do in this app?')}</h4><p>{tr('Keep the first version small. Write one feature per line.')}</p><textarea id="flow-features" aria-label={tr('Core features')} value={value.features} onChange={event => update('features', event.target.value)} placeholder={'View available slots\nMake a reservation\nView or cancel my reservations'}/><div className="prd-flow-ai"><button type="button" className="secondary" disabled={assistBusy || !onAssist || !value.appIdea.trim()} onClick={() => void assist('features')}>✦ {tr('Suggest core features')}</button><small>{demoIdeas ? tr('Demo suggestions only; no API call is made.') : tr('Your answers are sent to Upstage when you use AI help.')}</small></div>{featureSuggestion.length > 0 && <div className="prd-flow-suggestion"><p>{featureSuggestion.join(' · ')}</p><button type="button" className="secondary" onClick={() => { update('features', featureSuggestion.join('\n')); setFeatureSuggestion([]); }}>{tr('Use these features')}</button></div>}<label htmlFor="flow-design">{tr('Design requirements')} <span className="optional">{tr('optional')}</span></label><textarea id="flow-design" value={value.design} onChange={event => update('design', event.target.value)} placeholder={tr('Only add essential screen or accessibility needs.')}/></>}
      {section === 4 && <><span className="eyebrow">05 · {tr('Review & download')}</span><h4>{tr('Review your PRD before building.')}</h4><div className="prd-flow-review"><div><strong>{tr('Problem')}</strong><p>{problem}</p></div><div><strong>{tr('User')}</strong><input aria-label={tr('User')} value={user} onChange={event => update('user', event.target.value)} placeholder={tr('Who will use the app?')}/></div><div><strong>{tr('Goal')}</strong><p>{goal}</p></div><div><strong>{tr('App idea')}</strong><p>{value.appIdea}</p></div><div><strong>{tr('Core features')}</strong><ul>{features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}</ul></div><div><strong>{tr('Design requirements')}</strong><p>{value.design || tr('Not specified')}</p></div></div><p className="prd-flow-build-prompt">Build a simple web app based on this PRD. Start with the core features and keep the first version small.</p></>}
      {assistError && <p className="prd-ai-error" role="alert">{assistError}</p>}
    </div>
    {status && <p className="prd-save-status" role="status">{status}</p>}
    <div className="prd-wizard-actions"><button type="button" className="secondary" disabled={section === 0 || busy} onClick={previous}>{tr('← Previous')}</button><div><button type="button" className="secondary" disabled={busy} onClick={save}>{tr('Save draft')}</button>{section < 4 ? <button type="button" disabled={busy} onClick={next}>{tr('Next')} →</button> : <><button type="button" className="secondary" onClick={onDownload}>{tr('Download build-ready PRD (.md)')}</button><button type="button" disabled={busy || !user.trim()} onClick={onPublish}>{tr(published ? 'Update post' : 'Publish post')} ↗</button></>}</div></div>
  </section>;
}
