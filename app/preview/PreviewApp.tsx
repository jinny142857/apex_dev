'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { User } from 'firebase/auth';
import HomeNotices from '@/app/components/HomeNotices';
import PreworkExample from '@/app/components/PreworkExample';
import { splitPreworkGuide } from '@/lib/prework-example';
import OutcomeShowcase, { type OutcomePost } from '@/app/components/OutcomeShowcase';
import OutcomeSelfAssessment from '@/app/components/OutcomeSelfAssessment';
import WorkshopIcon from '@/app/components/WorkshopIcon';
import SiteFooter from '@/app/components/SiteFooter';
import { LanguageSwitch, useLanguage } from '@/app/components/LanguageProvider';
import ProblemPrdWizard, { type AssistContext, type AssistResult } from '@/app/components/ProblemPrdWizard';
import { buildPrdMarkdown, emptyPrd, type Prd } from '@/lib/prd';
import { demoPeople, demoPrework, makeDemoOutcomes } from '@/lib/demo-data';
import { emptySelfAssessment, validSelfAssessment } from '@/lib/outcome-self-assessment';
import curatedProblems from '@/lib/curated-app-ideas.json';
import type { PreworkReview } from '@/lib/prd-suggestions';

type Screen = 'home' | 'prework' | 'practice' | 'prd' | 'share' | 'admin';
type DemoPost = { id: string; ownerName: string; name?: string; text?: string; guide?: string; url?: string; problem?: string; user?: string; goal?: string; features?: string; design?: string; refinedProblem?: string; focusMoment?: string; desiredAction?: string; appIdea?: string; isExample?: boolean };
const user = { uid: 'sample-user-1' } as User;
const demoPrdReview: PreworkReview = {
  status: 'narrow',
  feedback: 'Your problem names a real coordination challenge. Keep the first app focused on one shared booking task.',
  suggestedProblem: curatedProblems[0].problemStatement,
  caution: '',
  ideas: curatedProblems[0].ideas,
};
const screens: { key: Screen; label: string; icon: Parameters<typeof WorkshopIcon>[0]['name'] }[] = [
  { key: 'home', label: 'Home', icon: 'spark' }, { key: 'prework', label: 'Pre-work', icon: 'assignment' }, { key: 'practice', label: 'Warm-up', icon: 'screen' }, { key: 'prd', label: 'Problem & PRD', icon: 'document' }, { key: 'share', label: 'Final outcomes', icon: 'spark' }, { key: 'admin', label: 'Admin', icon: 'people' },
];

function PreviewTaskEditor({ kind, content, onPublish, onClose }: { kind: 'prework' | 'practice' | 'prd'; content: string; onPublish: (post: DemoPost) => void; onClose: () => void }) {
  const [parts, setParts] = useState({ who: '', task: '', situation: '', rootCause: '' });
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [prd, setPrd] = useState<Prd>(emptyPrd);
  useEffect(() => { if (kind !== 'prd') return; try { setPrd({ ...emptyPrd, ...JSON.parse(localStorage.getItem('apex-demo-prd-draft') || '{}') }); } catch { /* Ignore invalid demo draft. */ } }, [kind]);
  function saveDemoPrdDraft(next: Prd) {
    try { localStorage.setItem('apex-demo-prd-draft', JSON.stringify(next)); return true; }
    catch { return false; }
  }
  const [statement, setStatement] = useState('');
  useEffect(() => {
    setStatement(Object.values(parts).some(value => value.trim()) ? `[${parts.who || 'WHO'}] struggle(s) to [${parts.task || 'TASK'}] when [${parts.situation || 'SITUATION'}] because [${parts.rootCause || 'ROOT CAUSE'}].` : '');
  }, [parts]);
  const publish = () => {
    if (kind === 'prd') { if (!['problem', 'user', 'goal', 'appIdea', 'features'].every(key => (prd as Record<string, string>)[key].trim())) return; onPublish({ id: `sample-prd-${Date.now()}`, ownerName: 'Alex', ...prd }); localStorage.setItem(`apex-demo-published-prd-${user.uid}`, JSON.stringify(prd)); localStorage.removeItem('apex-demo-prd-draft'); }
    else if (kind === 'prework') { if (!Object.values(parts).every(value => value.trim())) return; onPublish({ id: `sample-prework-${Date.now()}`, ownerName: 'Alex', text: statement }); }
    else { if (!link.trim()) return; onPublish({ id: `sample-warmup-${Date.now()}`, ownerName: 'Alex', name: note.trim().slice(0, 60) || 'Warm-up', url: link.trim(), guide: note.trim() }); }
    onClose();
  };
  if (kind === 'prework') return <section className="preview-content preview-task-editor"><div className="preview-task-columns"><aside className="preview-task-guide"><span className="eyebrow">ASSIGNMENT GUIDE</span>{content ? <><div className="markdown"><ReactMarkdown>{splitPreworkGuide(content).intro}</ReactMarkdown></div><PreworkExample/><div className="markdown"><ReactMarkdown>{splitPreworkGuide(content).rest}</ReactMarkdown></div></> : <p>Loading…</p>}</aside><div className="preview-task-response"><span className="eyebrow">YOUR RESPONSE</span><h2>Build your statement</h2><p className="prework-entry-help">Fill in the four boxes below. Your statement will appear automatically in “Your statement,” where you can edit it.</p><div className="prework-parts"><label>WHO <small>Who experiences this?</small><input value={parts.who} onChange={event => setParts({ ...parts, who: event.target.value })} placeholder="e.g. Teachers who share school spaces and equipment"/></label><label>TASK <small>What are they trying to do?</small><input value={parts.task} onChange={event => setParts({ ...parts, task: event.target.value })} placeholder="e.g. check availability and avoid conflicts"/></label><label>SITUATION <small>When or where does it happen?</small><input value={parts.situation} onChange={event => setParts({ ...parts, situation: event.target.value })} placeholder="e.g. when booking rooms for lessons"/></label><label>ROOT CAUSE <small>Why does it keep happening?</small><input value={parts.rootCause} onChange={event => setParts({ ...parts, rootCause: event.target.value })} placeholder="e.g. bookings are managed separately"/></label></div><label htmlFor="preview-prework">Your statement</label><textarea id="preview-prework" className="prework-preview" value={statement} onChange={event => setStatement(event.target.value)}/><div><button className="secondary" onClick={onClose}>← Back</button><button disabled={!Object.values(parts).every(value => value.trim())} onClick={publish}>Publish post →</button></div></div></div></section>;
  async function assistDemo(mode: 'ideas' | 'features', context: AssistContext): Promise<AssistResult> {
    if (process.env.NODE_ENV === 'development') {
      const response = await fetch('/api/prd-ideas', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-APEX-Demo': '2026' }, body: JSON.stringify({ mode, ...context }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not generate ideas.');
      return result;
    }
    if (mode === 'features') return { features: /equipment/i.test(context.appIdea)
      ? ['View available shared equipment', 'Submit an equipment request', 'Check or update my request status']
      : /room|booking|reserv/i.test(context.appIdea)
        ? ['Check room availability for a date and time', 'Reserve an available time slot', 'Review or cancel my reservations']
        : ['View information for the selected app idea', 'Complete its main task', 'Review the result'] };
    return { ideas: [
      { appIdea: 'A shared room booking app that helps teachers check availability and reserve a time slot.', rationale: 'It keeps room reservations in one place so teachers can avoid conflicts.', usageMode: 'Teacher use' },
      { appIdea: 'An equipment request app that helps teachers request shared resources and track their status.', rationale: 'It makes equipment requests visible to both teachers and the staff who coordinate them.', usageMode: 'School staff use' },
    ] };
  }
  if (kind === 'prd') return <section className="preview-content preview-task-editor"><ProblemPrdWizard value={prd} onChange={next => { setPrd(next); saveDemoPrdDraft(next); }} prework={demoPrework[0]?.text || ''} review={demoPrdReview} who="Teachers who share school spaces and equipment" onSaveDraft={saveDemoPrdDraft} onPublish={publish} onDownload={() => { const markdown = buildPrdMarkdown(prd, demoPrework[0]?.text || ''); const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'apex-dev-demo-prd.md'; anchor.click(); URL.revokeObjectURL(url); }} onAssist={assistDemo} demoIdeas={process.env.NODE_ENV !== 'development'} published={false}/><div className="preview-editor-actions"><button className="secondary" onClick={onClose}>← Back to posts</button></div></section>;
  return <section className="preview-content preview-task-editor"><div className="preview-task-response preview-warmup-editor"><span className="eyebrow">STEP 01 · YOUR CONTRIBUTION</span><h2>Share your warm-up link</h2><label htmlFor="preview-warmup-link">Result link</label><input id="preview-warmup-link" type="url" placeholder="https://..." value={link} onChange={event => setLink(event.target.value)}/><label htmlFor="preview-warmup-note">Note <span className="optional">optional</span></label><input id="preview-warmup-note" placeholder="What did you try or change?" value={note} onChange={event => setNote(event.target.value)}/><div><button className="secondary" onClick={onClose}>← Back</button><button disabled={!link.trim()} onClick={publish}>Publish post →</button></div></div></section>;
}

function PreviewBoard({ title, description, posts, onAdd, kind }: { title: string; description: string; posts: DemoPost[]; onAdd: (post: DemoPost) => void; kind: 'prework' | 'practice' | 'prd' }) {
  const { tr } = useLanguage();
  const [selected, setSelected] = useState<DemoPost | null>(null);
  const [writing, setWriting] = useState(false);
  const [guide, setGuide] = useState(false);
  const [content, setContent] = useState('');
  useEffect(() => { fetch('/content/problem-statement-assignment.md').then(r => r.text()).then(setContent).catch(() => setContent('')); }, []);
  if (writing) return <PreviewTaskEditor kind={kind} content={content} onPublish={onAdd} onClose={() => setWriting(false)}/>;
  return <section className="preview-content"><div className="preview-section-head"><div><p className="eyebrow">{kind === 'prework' ? 'STEP 00' : kind === 'practice' ? 'STEP 01' : 'STEP 02'}</p><h1>{tr(title)}</h1><p>{tr(description)}</p></div><div className="preview-head-actions">{kind === 'prework' && <button className="secondary" onClick={() => setGuide(true)}>{tr("Guide")}</button>}<button onClick={() => setWriting(true)}>{tr("+ New post")}</button></div></div><div className="preview-post-grid">{posts.map(post => <button className="preview-post-card" key={post.id} onClick={() => setSelected(post)}><span className="preview-post-icon"><WorkshopIcon name={kind === 'prework' ? 'assignment' : kind === 'practice' ? 'screen' : 'document'}/></span>{post.isExample && <span className="preview-example-tag">Example</span>}<h3>{post.name || post.problem || post.text?.slice(0, 80)}</h3><p>{post.text || post.guide || post.features}</p><footer><span>{post.ownerName}</span><strong>{tr("Read post")} →</strong></footer></button>)}</div>{selected && <div className="preview-modal-backdrop" onClick={() => setSelected(null)}><article className="preview-post-detail" role="dialog" aria-modal="true" aria-label="Read post" onClick={event => event.stopPropagation()}><button className="preview-close" onClick={() => setSelected(null)}>×</button><span className="eyebrow">{title.toUpperCase()} · {selected.ownerName}</span><h2>{selected.name || (kind === 'prework' ? 'Problem statement' : 'Problem & PRD')}</h2>{selected.text && <p>{selected.text}</p>}{selected.problem && <p><strong>Problem</strong><br/>{selected.problem}</p>}{selected.user && <p><strong>User</strong><br/>{selected.user}</p>}{selected.goal && <p><strong>Goal</strong><br/>{selected.goal}</p>}{selected.appIdea && <p><strong>App idea</strong><br/>{selected.appIdea}</p>}{selected.features && <p><strong>Core features</strong><br/>{selected.features}</p>}{selected.design && <p><strong>Design requirements</strong><br/>{selected.design}</p>}{selected.guide && <p>{selected.guide}</p>}{selected.url && <a href={selected.url} target="_blank" rel="noopener noreferrer">Open result ↗</a>}<div className="preview-detail-nav"><button className="secondary" disabled={posts.indexOf(selected) === 0} onClick={() => setSelected(posts[posts.indexOf(selected) - 1])}>← Previous</button><button className="secondary" disabled={posts.indexOf(selected) === posts.length - 1} onClick={() => setSelected(posts[posts.indexOf(selected) + 1])}>Next →</button></div></article></div>}{guide && <div className="preview-modal-backdrop" onClick={() => setGuide(false)}><article className="preview-post-detail" role="dialog" aria-modal="true" aria-label="Assignment guide" onClick={event => event.stopPropagation()}><button className="preview-close" onClick={() => setGuide(false)}>×</button><span className="eyebrow">ASSIGNMENT GUIDE</span>{content ? <><div className="markdown"><ReactMarkdown>{splitPreworkGuide(content).intro}</ReactMarkdown></div><PreworkExample/><div className="markdown"><ReactMarkdown>{splitPreworkGuide(content).rest}</ReactMarkdown></div></> : <p>Loading…</p>}<button onClick={() => { setGuide(false); setWriting(true); }}>Write my post →</button></article></div>}</section>;
}

export default function PreviewApp() {
  const { tr } = useLanguage();
  const [access, setAccess] = useState<boolean | null>(null);
  const [gatePassword, setGatePassword] = useState('');
  const [gateError, setGateError] = useState('');
  const [screen, setScreen] = useState<Screen>('home');
  const [admin, setAdmin] = useState(false);
  const [prework, setPrework] = useState<DemoPost[]>([...demoPrework]);
  const [practice, setPractice] = useState<DemoPost[]>([]);
  const [prd, setPrd] = useState<DemoPost[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomePost[]>([]);
  const [outcomeEditor, setOutcomeEditor] = useState(false);
  const [newOutcome, setNewOutcome] = useState({ name: '', features: '', url: '', selfAssessment: emptySelfAssessment });
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [guideVideoOpen, setGuideVideoOpen] = useState(false);
  function publishDemoOutcome() {
    if (!newOutcome.name.trim() || !validSelfAssessment(newOutcome.selfAssessment)) return;
    const post = { id: `sample-outcome-added-${Date.now()}`, ownerId: user.uid, ownerName: 'Alex', ...newOutcome };
    localStorage.setItem(`apex-demo-outcome-${post.id}`, JSON.stringify(post));
    const publishedPrd = localStorage.getItem(`apex-demo-published-prd-${user.uid}`);
    if (publishedPrd) localStorage.setItem(`apex-demo-outcome-prd-${post.id}`, publishedPrd);
    setOutcomes(previous => [post, ...previous]);
    setOutcomeEditor(false);
  }
  useEffect(() => { setAccess(localStorage.getItem('apexDevDemoAccess') === 'yes'); if (new URLSearchParams(window.location.search).get('admin') === '1') setAdmin(true); setOutcomes(makeDemoOutcomes()); }, []);
  const count = useMemo(() => prework.length + practice.length + prd.length + outcomes.length, [prework.length, practice.length, prd.length, outcomes.length]);
  function enterPreview(event: React.FormEvent) {
    event.preventDefault();
    if (gatePassword !== '2026') { setGateError(tr('Incorrect password. Please try again.')); return; }
    localStorage.setItem('apexDevDemoAccess', 'yes');
    setAccess(true);
  }
  if (access === null) return <main className="preview-loading" aria-label="Loading preview"/>;
  if (!access) return <main className="preview-gate-page"><header className="auth-header"><strong>APEX DEV</strong><LanguageSwitch/></header><form className="demo-gate" onSubmit={enterPreview}><div className="demo-gate-icon">✦</div><h1>{tr('Demo mode')}</h1><label htmlFor="preview-password">{tr('Enter demo password')}</label><input id="preview-password" type="password" inputMode="numeric" autoFocus value={gatePassword} onChange={event => { setGatePassword(event.target.value); setGateError(''); }} placeholder="••••"/>{gateError && <p className="demo-gate-error" role="alert">{gateError}</p>}<button>{tr('Enter preview')} →</button><a href="/">{tr('Back to Home')}</a></form><SiteFooter/></main>;
  return <main className="preview-app"><header className="preview-topbar"><div className="preview-brand"><span><WorkshopIcon name="spark"/></span><strong>APEX DEV</strong><em>{tr("Sample preview")}</em></div><div className="preview-top-actions"><button type="button" className="watch-guide-link" onClick={() => setGuideVideoOpen(true)}><span aria-hidden="true">▶</span> <span className="watch-guide-label">{tr('Watch the workshop guide')}</span></button><LanguageSwitch/><button className="secondary" onClick={() => setAdmin(!admin)}>{tr(admin ? 'Admin view' : 'Participant view')} ↔</button><a href="/">{tr("Exit preview")}</a></div></header><nav className="preview-nav" aria-label="Sample screens">{screens.map(item => <button key={item.key} className={screen === item.key ? 'active' : ''} onClick={() => setScreen(item.key)}><WorkshopIcon name={item.icon}/><span>{tr(item.label)}</span></button>)}</nav><div className="preview-page">{screen === 'home' && <HomeNotices onPrework={() => setScreen('prework')}/ >}{screen === 'prework' && <PreviewBoard title="Pre-work" description="Start with one challenge from your school or classroom." posts={prework} onAdd={post => setPrework(previous => [post, ...previous])} kind="prework"/>}{screen === 'practice' && <PreviewBoard title="Vibe coding warm-up" description="Share what you made while following along." posts={practice} onAdd={post => setPractice(previous => [post, ...previous])} kind="practice"/>}{screen === 'prd' && <PreviewBoard title="Problem & PRD" description="Refine the challenge, then describe a useful solution." posts={prd} onAdd={post => setPrd(previous => [post, ...previous])} kind="prd"/>}{screen === 'share' && <section className="preview-content"><div className="preview-section-head"><div><p className="eyebrow">STEP 03</p><h1>{tr("Final outcomes")}</h1></div></div><OutcomeShowcase demo posts={outcomes} currentUser={user} displayName="Alex" isAdmin={admin} onEdit={post => { setNewOutcome({ name: post.name || '', features: post.features || '', url: post.url || '', selfAssessment: { ...emptySelfAssessment, ...post.selfAssessment } }); setOutcomeEditor(true); }} onDelete={post => setOutcomes(previous => previous.filter(item => item.id !== post.id))} onNewPost={() => { setNewOutcome({ name: '', features: '', url: '', selfAssessment: { ...emptySelfAssessment } }); setOutcomeEditor(true); }}/>{outcomeEditor && <div className="preview-modal-backdrop" onClick={() => setOutcomeEditor(false)}><article className="preview-post-detail" role="dialog" aria-modal="true" aria-label="Submit outcome" onClick={event => event.stopPropagation()}><button className="preview-close" onClick={() => setOutcomeEditor(false)}>×</button><span className="eyebrow">SAMPLE EDITOR</span><h2>Submit an outcome</h2><label htmlFor="sample-outcome-name">Title</label><input id="sample-outcome-name" value={newOutcome.name} onChange={event => setNewOutcome({ ...newOutcome, name: event.target.value })}/><label htmlFor="sample-outcome-url">Link</label><input id="sample-outcome-url" value={newOutcome.url} onChange={event => setNewOutcome({ ...newOutcome, url: event.target.value })}/><label htmlFor="sample-outcome-features">What it does</label><textarea id="sample-outcome-features" value={newOutcome.features} onChange={event => setNewOutcome({ ...newOutcome, features: event.target.value })}/><OutcomeSelfAssessment idPrefix="sample-outcome" value={newOutcome.selfAssessment} onChange={selfAssessment => setNewOutcome(previous => ({ ...previous, selfAssessment }))}/><button disabled={!newOutcome.name.trim() || !validSelfAssessment(newOutcome.selfAssessment)} onClick={publishDemoOutcome}>Publish sample outcome</button></article></div>}</section>}{screen === 'admin' && <section className="preview-content"><div className="preview-section-head"><div><p className="eyebrow">WORKSHOP MANAGEMENT · SAMPLE</p><h1>{tr("Admin controls")}</h1><p>Preview controls below change only this sample session.</p></div><span className="status-pill open">{count} sample posts</span></div><div className="preview-admin-grid"><article className="utility-card"><h2>Stage visibility</h2>{screens.filter(item => !['home', 'admin'].includes(item.key)).map(item => <label className="preview-toggle" key={item.key}><span><WorkshopIcon name={item.icon}/>{item.label}</span><input type="checkbox" checked={!hidden[item.key]} onChange={() => setHidden({ ...hidden, [item.key]: !hidden[item.key] })}/></label>)}</article><article className="utility-card"><h2>Participant accounts</h2><p className="muted">15 participants · 4 teams</p><div className="preview-account-list">{demoPeople.map(([name, team]) => <div key={name}><span className="avatar">{name[0]}</span><strong>{name}</strong><small>Team {team}</small><button className="inline-link" onClick={() => window.alert('Sample preview: account changes are not saved.')}>Edit</button></div>)}</div></article></div></section>}</div>{guideVideoOpen && <div className="preview-modal-backdrop" onClick={() => setGuideVideoOpen(false)}><div className="auth-video-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-guide-video-title" onClick={event => event.stopPropagation()}><button type="button" className="auth-video-close" onClick={() => setGuideVideoOpen(false)} aria-label={tr('Close guide video')}>×</button><h2 id="preview-guide-video-title">{tr('Getting started with APEX DEV')}</h2><video controls playsInline preload="metadata" poster="/guide/apex-dev-prework-guide-poster.png"><source src="/guide/apex-dev-prework-guide.mp4" type="video/mp4"/>{tr('Your browser does not support this video.')}</video></div></div>}<SiteFooter/></main>;
}
