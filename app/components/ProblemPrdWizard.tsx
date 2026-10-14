'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { type Prd, stripProblemBrackets } from '@/lib/prd';
import PreworkReferenceDialog from './PreworkReferenceDialog';

export type Idea = { appIdea: string; features: string[]; rationale?: string; usageMode?: string };
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

const sections = ['Your problem & User', 'App idea', 'Core features', 'Design requirements', 'Review & download'];
const userOptions = ['Teacher', 'Student', 'Parent', 'School staff', 'Other'];
function inferUser(who: string) {
  const text = who.toLowerCase().trim();
  if (/^(teachers?|educators?)\b/.test(text)) return 'Teacher';
  if (/^(students?|pupils?)\b/.test(text)) return 'Student';
  if (/^(parents?|guardians?)\b/.test(text)) return 'Parent';
  if (/^(school staff|staff members?)\b/.test(text)) return 'School staff';
  return '';
}

export default function ProblemPrdWizard({ value, onChange, prework, who, onSaveDraft, onPublish, onDownload, published, busy, onAssist, demoIdeas = false }: Props) {
  const { tr } = useLanguage();
  const [section, setSection] = useState(0);
  const [status, setStatus] = useState('');
  const [assistBusy, setAssistBusy] = useState(false);
  const [assistError, setAssistError] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [featureSuggestion, setFeatureSuggestion] = useState<string[]>([]);
  const [goalGenerating, setGoalGenerating] = useState(false);
  const [goalEdited, setGoalEdited] = useState(Boolean(value.goal.trim()));
  const [userTouched, setUserTouched] = useState(Boolean(value.user.trim()));
  const [referencesOpen, setReferencesOpen] = useState(false);
  const inputVersion = useRef(0);
  const latestValue = useRef(value);
  latestValue.current = value;
  const problem = stripProblemBrackets(value.problem || value.refinedProblem || prework);
  const goal = value.goal;
  const user = value.user || (userTouched ? '' : inferUser(who));
  const selectedUsers = user.split(',').map(item => item.trim()).filter(Boolean);
  const customUser = user.split(',').filter(item => !userOptions.includes(item.trim())).join(',').replace(/^\s+/, '');
  const features = value.features.split('\n').map(item => item.trim().replace(/^([-*]|\d+[.)])\s*/, '')).filter(Boolean);
  const inclusiveDesign = value.inclusiveDesign || '';

  function update(key: keyof Prd, text: string) {
    const next = { ...value, [key]: key === 'problem' ? stripProblemBrackets(text) : text };
    latestValue.current = next;
    onChange(next);
    setStatus('');
    if (key === 'problem') setIdeas([]);
    if (key === 'appIdea') setFeatureSuggestion([]);
    if (key === 'goal') setGoalEdited(true);
    if (key === 'user') setUserTouched(true);
    if (['problem', 'user', 'appIdea', 'goal'].includes(key)) inputVersion.current += 1;
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
    const ready = section === 0 ? problem.trim() && selectedUsers.length > 0 : section === 1 ? value.appIdea.trim() : section === 2 ? features.length > 0 : section === 3 ? true : problem.trim() && selectedUsers.length > 0 && value.appIdea.trim() && features.length > 0;
    if (!ready) { setStatus(tr(section === 2 ? 'Write at least one core feature to continue.' : section === 0 ? 'Choose at least one user to continue.' : 'Complete this field to continue.')); return; }
    if (save()) setSection(current => Math.min(4, current + 1));
  }
  function previous() { if (save()) setSection(current => Math.max(0, current - 1)); }
  function revisit(target: number) { if (save()) setSection(target); }
  async function assist(mode: 'goal' | 'ideas' | 'features') {
    if (!onAssist) return;
    const requestedAtVersion = inputVersion.current;
    setAssistBusy(true); setAssistError('');
    if (mode === 'ideas') setIdeas([]);
    try {
      const result = await onAssist(mode, { problem, who: user, goal: '', appIdea: mode === 'features' ? value.appIdea : '' });
      if (requestedAtVersion !== inputVersion.current) return;
      if (mode === 'ideas') setIdeas(result.ideas || []);
      if (mode === 'features') setFeatureSuggestion(result.features || []);
      if (mode === 'ideas' && !result.ideas?.length) setAssistError(tr('No ideas came back. Please try again.'));
    } catch (error) { setAssistError(error instanceof Error ? error.message : tr('Could not generate ideas. Please try again.')); }
    finally { setAssistBusy(false); }
  }
  function chooseIdea(idea: Idea) {
    const next = { ...normalized(), appIdea: idea.appIdea, features: value.features.trim() ? value.features : idea.features.join('\n') };
    inputVersion.current += 1;
    latestValue.current = next;
    onChange(next);
    setStatus(onSaveDraft(next) ? tr('Idea added to your draft. You can edit every field.') : tr('Could not save this draft. Please try again.'));
    setIdeas([]);
  }
  async function generateGoal(force = false) {
    if (!onAssist || !problem.trim() || !selectedUsers.length || (!force && goalEdited && goal.trim())) return;
    const requestedAtVersion = inputVersion.current;
    setGoalGenerating(true); setAssistError('');
    try {
      const result = await onAssist('goal', { problem, who: user, goal: '', appIdea: value.appIdea });
      if (result.goal && requestedAtVersion === inputVersion.current) {
        const next = { ...latestValue.current, problem, user, goal: result.goal, startingProblem: latestValue.current.startingProblem || stripProblemBrackets(prework) };
        latestValue.current = next;
        onChange(next);
        setGoalEdited(false);
      }
    } catch (error) { setAssistError(error instanceof Error ? error.message : tr('Could not generate ideas. Please try again.')); }
    finally { setGoalGenerating(false); }
  }
  useEffect(() => {
    if (section === 4 && !goal.trim() && !goalGenerating && !assistError) void generateGoal();
    // Goal generation is intentionally triggered only when Review is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);
  return <section className="editor-panel prd-flow">
    <div className="panel-heading"><div><p className="eyebrow">STEP 02 · YOUR CONTRIBUTION</p><h3>{tr('From problem to PRD')}</h3><p className="panel-subtitle">{tr('Move from a clear problem to a small app you can build.')}</p></div><span className="privacy-pill">{published ? tr('Published · editing') : tr('Private draft')}</span></div>
    <div className="prd-flow-meter" aria-label={tr('PRD progress')}><div className="prd-flow-meter-head"><strong>{tr(sections[section])}</strong><span>{section + 1} / {sections.length}</span></div><div className="prd-flow-track"><span style={{ width: `${((section + 1) / sections.length) * 100}%` }}/></div></div>
    {section > 0 && <div className="prd-flow-recap">{sections.slice(0, section).map((label, index) => <button type="button" key={label} onClick={() => revisit(index)}><span>✓ {tr(label)}</span><strong>{index === 0 ? problem : index === 1 ? value.appIdea : index === 2 ? features.join('; ') : value.design || tr('Not specified')}</strong><small>{tr('Edit')} ↗</small></button>)}</div>}
    <div className="prd-flow-current">
      {section === 0 && <><span className="eyebrow">01 · {tr('Your problem & User')}</span><h4>{tr('Check the problem you brought from Pre-work.')}</h4><p>{tr('Change it only if a clearer version will help you design the app.')}</p><div className="prd-problem-label-row"><label htmlFor="flow-problem">{tr('Your problem')}</label><button type="button" className="secondary" onClick={() => setReferencesOpen(true)}>▦ {tr('Browse references')}</button></div><textarea id="flow-problem" value={problem} onChange={event => update('problem', event.target.value)} placeholder={tr('Describe the challenge in one clear sentence.')}/><label>{tr('Who will use this app?')}</label><p>{tr('Choose the people who will use it. Add more detail if needed.')}</p><div className="prd-user-options">{userOptions.map(option => <label key={option}><input type="checkbox" checked={selectedUsers.includes(option)} onChange={event => { const next = event.target.checked ? [...selectedUsers, option] : selectedUsers.filter(item => item !== option); update('user', next.join(', ')); }}/><span>{tr(option)}</span></label>)}</div><input aria-label={tr('Specific users')} value={customUser} onChange={event => { const custom = event.target.value; update('user', [...selectedUsers.filter(item => userOptions.includes(item)), ...(custom ? [custom] : [])].join(', ')); }} placeholder={tr('Add detail (optional)')} /></>}
      {section === 1 && <><span className="eyebrow">02 · {tr('App idea')}</span><h4>{tr('What could a web app help your users do?')}</h4><p>{tr('Choose one task. Think: see, organize, share, or do.')}</p><textarea id="flow-idea" aria-label={tr('App idea')} value={value.appIdea} onChange={event => update('appIdea', event.target.value)} placeholder={tr('A simple app that helps teachers organize consent forms.')}/><div className="prd-flow-ai"><button type="button" className="secondary" disabled={assistBusy || !onAssist || problem.trim().length < 15 || !selectedUsers.length} onClick={() => void assist('ideas')}>✦ {assistBusy ? tr('Thinking…') : tr('Get app ideas')}</button><small>{demoIdeas ? tr('Demo suggestions only; no API call is made.') : tr('Do not include personal information.')}</small></div>{ideas.length > 0 && <div className="prd-flow-ideas" aria-label={tr('Suggested app ideas')}>{ideas.map((idea, index) => <article key={`${idea.appIdea}-${index}`}><span>0{index + 1}</span><strong>{idea.appIdea}</strong>{idea.rationale && <p>{idea.rationale}</p>}{idea.usageMode && <small className="prd-usage-mode">{tr(idea.usageMode)}</small>}<button type="button" className="secondary" onClick={() => chooseIdea(idea)}>{tr('Use this idea')}</button></article>)}</div>}</>}
      {section === 2 && <><span className="eyebrow">03 · {tr('Core features')}</span><h4>{tr('What are the essential things your users should be able to do in the first version?')}</h4><p>{tr('Start with the essential actions. Write one feature per line.')}</p><textarea id="flow-features" aria-label={tr('Core features')} value={value.features} onChange={event => update('features', event.target.value)} placeholder={'Users can ...\nUsers can ...\nUsers can ...'}/><div className="prd-flow-ai"><button type="button" className="secondary" disabled={assistBusy || !onAssist || !value.appIdea.trim()} onClick={() => void assist('features')}>✦ {tr('Suggest core features')}</button><small>{demoIdeas ? tr('Demo suggestions only; no API call is made.') : tr('Do not include personal information.')}</small></div>{featureSuggestion.length > 0 && <div className="prd-flow-suggestion"><p>{featureSuggestion.join(' · ')}</p><button type="button" className="secondary" onClick={() => { update('features', featureSuggestion.join('\n')); setFeatureSuggestion([]); }}>{tr('Use these features')}</button></div>}<div className="inclusive-check"><label>{tr('Inclusive design check')} <span className="optional">{tr('optional')}</span></label><p>{tr('What would make this app easier for your users to use?')}</p><small>{tr('Choose a practical requirement, or add your own if needed.')}</small><div className="prd-inclusive-options">{['Easy to read and use on a phone', 'Clear language and simple instructions', 'Readable text and strong contrast', 'Lightweight pages for slow internet connections', 'Easy to use with a keyboard'].map(option => <label key={option}><input type="checkbox" checked={inclusiveDesign.split('\n').includes(option)} onChange={event => { const current = inclusiveDesign.split('\n').filter(Boolean); const next = event.target.checked ? [...current, option] : current.filter(item => item !== option); update('inclusiveDesign', next.join('\n')); }}/><span>{tr(option)}</span></label>)}</div><input aria-label={tr('Other inclusive design requirement')} value={inclusiveDesign.split('\n').find(item => !['Easy to read and use on a phone', 'Clear language and simple instructions', 'Readable text and strong contrast', 'Lightweight pages for slow internet connections', 'Easy to use with a keyboard'].includes(item)) || ''} onChange={event => { const choices = inclusiveDesign.split('\n').filter(item => ['Easy to read and use on a phone', 'Clear language and simple instructions', 'Readable text and strong contrast', 'Lightweight pages for slow internet connections', 'Easy to use with a keyboard'].includes(item)); update('inclusiveDesign', [...choices, event.target.value].filter(Boolean).join('\n')); }} placeholder={tr('Add another inclusive design requirement')} /></div></>}
      {section === 3 && <><span className="eyebrow">04 · {tr('Design requirements')}</span><h4>{tr('What should the app look and feel like?')}</h4><p>{tr('Add optional visual, tone, layout, or accessibility guidance for the build. You can also skip this step.')}</p><textarea id="flow-design" aria-label={tr('Design requirements')} value={value.design} onChange={event => update('design', event.target.value)} placeholder={tr('e.g. Use a calm blue palette with a clear, friendly layout.')}/></>}
      {section === 4 && <><span className="eyebrow">05 · {tr('Review & download')}</span><h4>{tr('Review your PRD before building.')}</h4>{!goal.trim() && <div className="prd-flow-ai"><button type="button" className="secondary" disabled={goalGenerating || !onAssist} onClick={() => void generateGoal()}>{goalGenerating ? tr('Generating goal…') : tr('Generate goal')}</button><small>{tr('Your current problem, users, and app idea will be used.')}</small></div>}<div className="prd-flow-review"><div><strong>{tr('Problem')}</strong><p>{problem}</p></div><div><strong>{tr('User')}</strong><input aria-label={tr('User')} value={user} onChange={event => { update('user', event.target.value); }} /></div><div><strong>{tr('Goal')}</strong><textarea aria-label={tr('Goal')} value={goal} onChange={event => update('goal', event.target.value)} placeholder={tr('Describe the improvement you want for your users.')}/>{goal.trim() && <button type="button" className="inline-link" onClick={() => void generateGoal(true)}>{tr('Regenerate goal')}</button>}</div><div><strong>{tr('App idea')}</strong><p>{value.appIdea}</p></div><div><strong>{tr('Core features')}</strong><ul>{features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}</ul></div><div><strong>{tr('Inclusive design')}</strong><p>{inclusiveDesign || tr('Not specified')}</p></div><div><strong>{tr('Design requirements')}</strong><p>{value.design || tr('Not specified')}</p></div></div></>}
      {assistError && <p className="prd-ai-error" role="alert">{assistError}</p>}
    </div>
    {status && <p className="prd-save-status" role="status">{status}</p>}
    <div className="prd-wizard-actions"><button type="button" className="secondary" disabled={section === 0 || busy} onClick={previous}>{tr('← Previous')}</button><div><button type="button" className="secondary" disabled={busy} onClick={save}>{tr('Save draft')}</button>{section < 3 ? <button type="button" disabled={busy} onClick={next}>{tr('Next')} →</button> : section === 3 ? <><button type="button" className="secondary" disabled={busy} onClick={() => { if (save()) setSection(4); }}>{tr('Pass for now')}</button><button type="button" disabled={busy} onClick={next}>{tr('Review draft')} →</button></> : <><button type="button" className="secondary" onClick={onDownload}>{tr('Download build-ready PRD (.md)')}</button><button type="button" disabled={busy || !user.trim() || !goal.trim()} onClick={onPublish}>{tr(published ? 'Update post' : 'Publish post')} ↗</button></>}</div></div>
    {referencesOpen && <PreworkReferenceDialog currentProblem={problem} onClose={() => setReferencesOpen(false)} onImport={sentence => { const draft = { ...normalized(), problem: sentence }; update('problem', sentence); setStatus(tr(onSaveDraft(draft) ? 'Reference loaded and saved. Review the problem and User before continuing.' : 'Reference loaded. Save the draft before leaving this page.')); setReferencesOpen(false); }}/ >}
  </section>;
}
