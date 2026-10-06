'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { clientAuth, clientDb } from '@/lib/firebase';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithCustomToken, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

type Stage = 'prework' | 'prd' | 'share';
type View = Stage | 'admin';
type Settings = Record<Stage, boolean>;
type Prd = { problem: string; user: string; goal: string; features: string };
type Post = { id: string; ownerId: string; ownerName?: string; text?: string; problem?: string; user?: string; goal?: string; features?: string; name?: string; url?: string; guide?: string; isPublic?: boolean; isExample?: boolean; updatedAt?: { toDate?: () => Date } };
const defaults: Settings = { prework: true, prd: false, share: false };
const emptyPrd: Prd = { problem: '', user: '', goal: '', features: '' };
const emptyOutcome = { name: '', url: '', problem: '', features: '', guide: '' };
const stages: { key: Stage; number: string; title: string; short: string; description: string }[] = [
  { key: 'prework', number: '01', title: 'Pre-work', short: 'Pre-work', description: 'Start with a challenge from your school or teaching context.' },
  { key: 'prd', number: '02', title: 'Problem definition & PRD', short: 'Problem & PRD', description: 'Shape your problem into a clear, useful plan.' },
  { key: 'share', number: '03', title: 'Outcomes', short: 'Outcomes', description: 'Share what you created and learn from your peers.' },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ nickname?: string; role?: string; preworkGuideSeenAt?: string } | null>(null);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [view, setView] = useState<View>('prework');
  const [pageMode, setPageMode] = useState<'board' | 'editor'>('board');
  const [login, setLogin] = useState({ identifier: '', password: '' });
  const [signup, setSignup] = useState({ nickname: '', email: '', password: '' });
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [message, setMessage] = useState('');
  const [prework, setPrework] = useState('');
  const [prd, setPrd] = useState<Prd>(emptyPrd);
  const [outcome, setOutcome] = useState({ ...emptyOutcome, id: '' });
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<Record<Stage, Post[]>>({ prework: [], prd: [], share: [] });
  const [openPost, setOpenPost] = useState<{ stage: Stage; id: string } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePromptedUserId, setGuidePromptedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [adminPosts, setAdminPosts] = useState<Record<Stage, Post[]>>({ prework: [], prd: [], share: [] });
  const [editing, setEditing] = useState<{ stage: Stage; post: Post } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(clientAuth(), async current => {
    setUser(current);
    setProfile(null);
    if (current) {
      const snapshot = await getDoc(doc(clientDb(), 'users', current.uid));
      setProfile(snapshot.data() || null);
    }
  }), []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(clientDb(), 'settings', 'site'), snapshot => setSettings({ ...defaults, ...(snapshot.data() || {}) }));
  }, [user]);
  useEffect(() => { fetch('/content/problem-statement-assignment.md').then(r => r.text()).then(setContent).catch(() => setContent('')); }, []);
  useEffect(() => {
    if (!user || !profile || view !== 'prework' || pageMode !== 'board' || guidePromptedUserId === user.uid) return;
    setGuidePromptedUserId(user.uid);
    if (!profile.preworkGuideSeenAt) setGuideOpen(true);
  }, [user, profile, view, pageMode, guidePromptedUserId]);
  useEffect(() => {
    if (!user) return;
    const db = clientDb();
    getDoc(doc(db, 'prework', user.uid)).then(s => setPrework(s.data()?.text || ''));
    getDoc(doc(db, 'prds', user.uid)).then(s => setPrd({ ...emptyPrd, ...(s.data() || {}) }));
    getDocs(query(collection(db, 'projects'), where('ownerId', '==', user.uid))).then(s => {
      if (s.docs[0]) setOutcome({ ...emptyOutcome, ...s.docs[0].data(), id: s.docs[0].id });
    });
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const unsubscribe = stages.map(({ key }) => onSnapshot(query(collection(clientDb(), key === 'prd' ? 'prds' : key === 'share' ? 'projects' : 'prework'), where('isPublic', '==', true)), snapshot => {
      const entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post)).sort((a, b) => Number(!!b.isExample) - Number(!!a.isExample) || (b.updatedAt?.toDate?.().getTime() || 0) - (a.updatedAt?.toDate?.().getTime() || 0));
      setPosts(previous => ({ ...previous, [key]: entries }));
    }, () => setMessage('Unable to load shared posts. Check your Firestore rules.')));
    return () => unsubscribe.forEach(stop => stop());
  }, [user]);

  const isAdmin = profile?.role === 'admin';
  const name = profile?.nickname || user?.displayName || 'Participant';
  const allowed = (stage: Stage) => isAdmin || settings[stage];
  const active = stages.find(s => s.key === view);
  const stagePosts = active ? posts[active.key] : [];
  const openPostIndex = active && openPost?.stage === active.key ? stagePosts.findIndex(post => post.id === openPost.id) : -1;
  const visiblePosts = openPostIndex < 0 ? stagePosts : [stagePosts[openPostIndex], ...stagePosts.filter((_, index) => index !== openPostIndex)];
  const completed: Record<Stage, boolean> = { prework: !!prework.trim(), prd: !!prd.problem.trim(), share: !!outcome.id };

  async function closeGuide(startWriting = false) {
    setGuideOpen(false);
    if (startWriting) { setOpenPost(null); setPageMode('editor'); }
    if (!user || profile?.preworkGuideSeenAt) return;
    setProfile(previous => previous ? { ...previous, preworkGuideSeenAt: new Date().toISOString() } : previous);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/guide-seen', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not save guide preference.');
    } catch {
      setMessage('The guide may appear again next time. You can still open it from the Pre-work page.');
    }
  }

  async function register(event: React.FormEvent) {
    event.preventDefault(); setMessage(''); setBusy(true);
    try {
      const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(signup) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create account.');
      await signInWithEmailAndPassword(clientAuth(), signup.email, signup.password);
      setMessage('Account created. Keep your password private.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not create account.'); }
    finally { setBusy(false); }
  }
  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setMessage(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: login.identifier, password: login.password }) });
      const result = await response.json();
      if (!response.ok) throw new Error();
      await signInWithCustomToken(clientAuth(), result.token);
    } catch { setMessage('We could not sign you in. Please check your nickname and password.'); }
    finally { setBusy(false); }
  }
  async function resetPassword(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await sendPasswordResetEmail(clientAuth(), resetEmail.trim());
      setMessage('If this email is registered, you will receive a password reset link.');
      setAuthMode('signin');
    } catch {
      setMessage('We could not send the reset email. Please check the address and try again.');
    } finally { setBusy(false); }
  }
  async function savePrework() {
    if (!user || !prework.trim()) return setMessage('Write your problem statement before publishing.');
    setBusy(true);
    try {
      const target = editing?.stage === 'prework' ? editing.post : null;
      await setDoc(doc(clientDb(), 'prework', target?.id || user.uid), { ownerId: target?.ownerId || user.uid, ownerName: target?.ownerName || name, text: prework.trim(), isPublic: true, updatedAt: serverTimestamp() }, { merge: true });
      setEditing(null);
      if (target && target.ownerId !== user.uid) setPrework((await getDoc(doc(clientDb(), 'prework', user.uid))).data()?.text || '');
      setMessage('Your pre-work is published to the group.');
      setPageMode('board');
    } catch { setMessage('Could not publish pre-work. Please try again.'); }
    finally { setBusy(false); }
  }
  async function savePrd() {
    if (!user || !Object.values(prd).some(v => v.trim())) return setMessage('Add something to your plan before publishing.');
    setBusy(true);
    try {
      const target = editing?.stage === 'prd' ? editing.post : null;
      await setDoc(doc(clientDb(), 'prds', target?.id || user.uid), { ...prd, ownerId: target?.ownerId || user.uid, ownerName: target?.ownerName || name, isPublic: true, updatedAt: serverTimestamp() }, { merge: true });
      setEditing(null);
      if (target && target.ownerId !== user.uid) setPrd({ ...emptyPrd, ...((await getDoc(doc(clientDb(), 'prds', user.uid))).data() || {}) });
      setMessage('Your problem definition and PRD are published to the group.');
      setPageMode('board');
    } catch { setMessage('Could not publish your plan. Please try again.'); }
    finally { setBusy(false); }
  }
  function downloadPrd() {
    const markdown = `# ${name}'s PRD\n\n## Problem\n${prd.problem}\n\n## User\n${prd.user}\n\n## Goal\n${prd.goal}\n\n## Core features\n${prd.features}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'schoollab-prd.md'; anchor.click(); URL.revokeObjectURL(url);
  }
  async function saveOutcome() {
    if (!user || !outcome.name.trim()) return setMessage('Add a title before publishing.');
    if (outcome.url) { try { const parsed = new URL(outcome.url); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); } catch { return setMessage('Enter a valid http or https link.'); } }
    setBusy(true);
    try {
      const { id, ...fields } = outcome;
      const target = editing?.stage === 'share' ? editing.post : null;
      const data = { ...fields, ownerId: target?.ownerId || user.uid, ownerName: target?.ownerName || name, isPublic: true, updatedAt: serverTimestamp() };
      if (id) await setDoc(doc(clientDb(), 'projects', id), data, { merge: true });
      else { const ref = doc(collection(clientDb(), 'projects')); await setDoc(ref, data); setOutcome(previous => ({ ...previous, id: ref.id })); }
      setEditing(null);
      if (target && target.ownerId !== user.uid) {
        const mine = await getDocs(query(collection(clientDb(), 'projects'), where('ownerId', '==', user.uid)));
        setOutcome(mine.docs[0] ? { ...emptyOutcome, ...mine.docs[0].data(), id: mine.docs[0].id } : { ...emptyOutcome, id: '' });
      }
      setMessage('Your outcome is published to the group.');
      setPageMode('board');
    } catch { setMessage('Could not publish your outcome. Please try again.'); }
    finally { setBusy(false); }
  }
  async function removePost(stage: Stage, post: Post) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    const collectionName = stage === 'prd' ? 'prds' : stage === 'share' ? 'projects' : 'prework';
    await deleteDoc(doc(clientDb(), collectionName, post.id));
    if (post.ownerId === user?.uid) {
      if (stage === 'prework') setPrework('');
      if (stage === 'prd') setPrd(emptyPrd);
      if (stage === 'share') setOutcome({ ...emptyOutcome, id: '' });
    }
    setMessage('Post deleted.');
    if (isAdmin) loadAdmin();
  }
  async function toggle(stage: Stage) { await setDoc(doc(clientDb(), 'settings', 'site'), { [stage]: !settings[stage] }, { merge: true }); }
  async function loadAdmin() {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setUsers(await response.json());
    const [pre, plans, outcomes] = await Promise.all([
      getDocs(collection(clientDb(), 'prework')),
      getDocs(collection(clientDb(), 'prds')),
      getDocs(collection(clientDb(), 'projects')),
    ]);
    setAdminPosts({ prework: pre.docs.map(d => ({ id: d.id, ...d.data() } as Post)), prd: plans.docs.map(d => ({ id: d.id, ...d.data() } as Post)), share: outcomes.docs.map(d => ({ id: d.id, ...d.data() } as Post)) });
  }
  async function editUser(uid: string, nickname: string, password: string) {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ uid, nickname, password }) });
    const result = await response.json();
    setMessage(result.ok ? 'User account updated.' : result.error);
    loadAdmin();
  }
  function editPost(stage: Stage, post: Post) {
    setEditing({ stage, post });
    if (stage === 'prework') setPrework(post.text || '');
    setPageMode('editor');
    if (stage === 'prd') setPrd({ problem: post.problem || '', user: post.user || '', goal: post.goal || '', features: post.features || '' });
    if (stage === 'share') setOutcome({ ...emptyOutcome, ...post, id: post.id });
    setView(stage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function cancelEdit() {
    if (!user) return;
    const stage = editing?.stage;
    setEditing(null);
    setPageMode('board');
    if (stage === 'prework') setPrework((await getDoc(doc(clientDb(), 'prework', user.uid))).data()?.text || '');
    if (stage === 'prd') setPrd({ ...emptyPrd, ...((await getDoc(doc(clientDb(), 'prds', user.uid))).data() || {}) });
    if (stage === 'share') {
      const mine = await getDocs(query(collection(clientDb(), 'projects'), where('ownerId', '==', user.uid)));
      setOutcome(mine.docs[0] ? { ...emptyOutcome, ...mine.docs[0].data(), id: mine.docs[0].id } : { ...emptyOutcome, id: '' });
    }
  }

  if (!user) return <main className="auth-shell">
    <header className="auth-header"><BrandMark/><strong>APEX DEV</strong></header>
    <section className="auth-main"><div className="auth-heading"><p className="eyebrow">YOUR WORKSHOP SPACE</p><h1>{authMode === 'signin' ? 'Welcome back' : authMode === 'signup' ? 'Create your account' : 'Reset your password'}</h1><p>{authMode === 'signin' ? 'Sign in to continue your work and explore ideas from the group.' : authMode === 'signup' ? 'Start with a nickname. Your work will be shared when you publish it.' : 'Enter the email you used when creating your account.'}</p></div>
      <div className="auth-card">
        {authMode === 'signin' && <form onSubmit={signIn}><label htmlFor="login-nickname">Nickname</label><input id="login-nickname" autoComplete="username" required placeholder="Your nickname" value={login.identifier} onChange={e => setLogin({ ...login, identifier: e.target.value })}/><label htmlFor="login-password">Password</label><div className="password-field"><input id="login-password" autoComplete="current-password" required type={showPassword ? 'text' : 'password'} placeholder="Your password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })}/><button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div><button className="auth-submit" disabled={busy}>Sign in</button><div className="auth-links"><span>New to APEX DEV? <button type="button" className="inline-link" onClick={() => { setAuthMode('signup'); setMessage(''); }}>Create an account</button></span><button type="button" className="inline-link" onClick={() => { setAuthMode('reset'); setMessage(''); }}>Forgot password?</button></div></form>}
        {authMode === 'signup' && <form onSubmit={register}><label htmlFor="signup-nickname">Nickname</label><input id="signup-nickname" autoComplete="username" required placeholder="Your nickname" value={signup.nickname} onChange={e => setSignup({ ...signup, nickname: e.target.value })}/><label htmlFor="signup-email">Email</label><input id="signup-email" autoComplete="email" required type="email" placeholder="name@gmail.com" value={signup.email} onChange={e => setSignup({ ...signup, email: e.target.value })}/><label htmlFor="signup-password">Password</label><div className="password-field"><input id="signup-password" autoComplete="new-password" required minLength={8} type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={signup.password} onChange={e => setSignup({ ...signup, password: e.target.value })}/><button type="button" className="show-password" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div><p className="auth-help">We use your email for account recovery and workshop communication. Please do not enter student names or sensitive school information.</p><button className="auth-submit" disabled={busy}>Create account</button><div className="auth-links"><span>Already have an account? <button type="button" className="inline-link" onClick={() => { setAuthMode('signin'); setMessage(''); }}>Sign in</button></span></div></form>}
        {authMode === 'reset' && <form onSubmit={resetPassword}><label htmlFor="reset-email">Email</label><input id="reset-email" autoComplete="email" required type="email" placeholder="name@gmail.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)}/><button className="auth-submit" disabled={busy}>Send reset link</button><div className="auth-links"><button type="button" className="inline-link" onClick={() => { setAuthMode('signin'); setMessage(''); }}>Back to sign in</button></div></form>}
      </div>{message && <p role="status" className="auth-message">{message}</p>}
    </section>
  </main>;

  return <main className="app-shell">
    <header className="topbar"><div className="topbar-inner"><div className="brand"><BrandMark/><strong>APEX DEV</strong></div><div className="account"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span className="account-name">{name}</span><button className="text-button" onClick={() => signOut(clientAuth())}>Sign out</button></div></div></header>
    <div className="workspace">
      <nav className="stage-nav" aria-label="Workshop stages">{stages.filter(s => allowed(s.key)).map(s => <button key={s.key} className={`stage-tab ${view === s.key ? 'current' : ''}`} onClick={() => { if (editing) void cancelEdit(); setView(s.key); setPageMode('board'); setOpenPost(null); }}><span className="stage-number">{s.number}</span><span>{s.short}</span>{completed[s.key] && <span className="complete-mark" aria-label="Completed">✓</span>}</button>)}{isAdmin && <button className={`stage-tab admin-tab ${view === 'admin' ? 'current' : ''}`} onClick={() => { if (editing) void cancelEdit(); setView('admin'); setOpenPost(null); loadAdmin(); }}>Admin</button>}</nav>
      {message && <div role="status" className="notice">{message}<button className="notice-close" aria-label="Dismiss message" onClick={() => setMessage('')}>×</button></div>}
      {active && allowed(active.key) && <><section className="section-heading stage-heading"><div><p className="eyebrow">STEP {active.number} / 03</p><h2>{pageMode === 'editor' ? (view === 'prework' ? 'Write your Pre-work post' : view === 'prd' ? 'Write your Problem & PRD post' : 'Share your outcome') : active.title}</h2><p>{pageMode === 'editor' && view === 'prework' ? 'Use the guide while you shape your problem statement.' : active.description}</p></div><div className="stage-actions">{view === 'prework' && pageMode === 'board' && <button className="secondary" onClick={() => setGuideOpen(true)}>Guide</button>}<button className={pageMode === 'editor' ? 'secondary' : ''} onClick={() => { if (pageMode === 'editor') { if (editing) void cancelEdit(); else setPageMode('board'); } else { setOpenPost(null); setPageMode('editor'); } }}>{pageMode === 'editor' ? '← Back to posts' : '+ New post'}</button></div></section>
        {editing?.stage === view && <div className="editing-banner">Editing {editing.post.ownerName || 'participant'}’s post <button className="inline-link" onClick={cancelEdit}>Cancel editing</button></div>}
        {view === 'prework' && pageMode === 'editor' && <section className="editor-panel prework-editor"><div className="panel-heading"><div><p className="eyebrow">YOUR CONTRIBUTION</p><h3>Define a school challenge</h3></div><span className="privacy-pill">Shared with the group</span></div><div className="prework-columns"><aside className="assignment-guide"><div className="column-label">ASSIGNMENT GUIDE</div><div className="markdown"><ReactMarkdown>{content}</ReactMarkdown></div></aside><div className="statement-column"><div className="column-label">YOUR RESPONSE</div><label htmlFor="prework">Problem statement</label><p className="field-help">Write one clear statement using the template on the left.</p><textarea id="prework" className="large-editor" placeholder="[WHO] struggle(s) to [SPECIFIC TASK OR PAIN] when [SITUATION / CONTEXT] because [ROOT CAUSE]." value={prework} onChange={e => setPrework(e.target.value)}/><p className="field-help">Your post will be visible to other workshop participants.</p></div></div><div className="editor-footer"><p>You can update your statement later.</p><button disabled={busy} onClick={savePrework}>{posts.prework.some(p => p.id === user.uid) || editing?.stage === 'prework' ? 'Update post' : 'Publish post'} <span aria-hidden="true">↗</span></button></div></section>}
        {view === 'prd' && pageMode === 'editor' && <section className="editor-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR CONTRIBUTION</p><h3>Define the problem and plan</h3></div><span className="privacy-pill">Shared with the group</span></div><div className="context-note"><strong>From your Pre-work</strong><p>{prework || 'Your saved problem statement will appear here.'}</p></div><div className="form-grid">{([['problem', 'Problem', 'What problem are you trying to address?'], ['user', 'User', 'Who will use the app?'], ['goal', 'Goal', 'What should users be able to do with the app?'], ['features', 'Core features', 'What are the one or two most important features?']] as const).map(([key, title, hint]) => <div className="field" key={key}><label htmlFor={`prd-${key}`}>{title}</label><textarea id={`prd-${key}`} placeholder={hint} value={prd[key]} onChange={e => setPrd({ ...prd, [key]: e.target.value })}/></div>)}</div><div className="editor-footer"><p>Your plan will appear in the shared Problem & PRD board.</p><div className="actions"><button className="secondary" onClick={downloadPrd}>Download .md</button><button disabled={busy} onClick={savePrd}>{posts.prd.some(p => p.id === user.uid) ? 'Update post' : 'Publish post'} <span aria-hidden="true">↗</span></button></div></div></section>}
        {view === 'share' && pageMode === 'editor' && <section className="editor-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR CONTRIBUTION</p><h3>Share your outcome</h3></div><span className="privacy-pill">Shared with the group</span></div><div className="form-grid"><div className="field"><label htmlFor="outcome-name">Title</label><input id="outcome-name" placeholder="What did you create?" value={outcome.name} onChange={e => setOutcome({ ...outcome, name: e.target.value })}/></div><div className="field"><label htmlFor="outcome-url">Link <span className="optional">optional</span></label><input id="outcome-url" type="url" placeholder="https://..." value={outcome.url} onChange={e => setOutcome({ ...outcome, url: e.target.value })}/></div><div className="field"><label htmlFor="outcome-problem">Problem addressed</label><textarea id="outcome-problem" placeholder="What challenge does it respond to?" value={outcome.problem} onChange={e => setOutcome({ ...outcome, problem: e.target.value })}/></div><div className="field"><label htmlFor="outcome-features">What it does</label><textarea id="outcome-features" placeholder="Describe the main features or result." value={outcome.features} onChange={e => setOutcome({ ...outcome, features: e.target.value })}/></div></div><label htmlFor="outcome-guide">Introduction or instructions <span className="optional">optional</span></label><textarea id="outcome-guide" placeholder="Anything your peers should know before exploring?" value={outcome.guide} onChange={e => setOutcome({ ...outcome, guide: e.target.value })}/><div className="editor-footer"><p>Projects, resources, documents, and prototypes are all welcome.</p><button disabled={busy} onClick={saveOutcome}>{outcome.id ? 'Update outcome' : 'Publish outcome'} <span aria-hidden="true">↗</span></button></div></section>}
        {pageMode === 'board' && <section className="board board-primary"><div className="board-heading"><div><h3>Shared work <span>{stagePosts.length}</span></h3><p>Ideas and progress from the group.</p></div></div><div className="post-grid">{visiblePosts.length ? visiblePosts.map(post => <PostCard key={post.id} stage={active.key} post={post} currentUser={user} isAdmin={isAdmin} expanded={openPost?.stage === active.key && openPost.id === post.id} position={stagePosts.findIndex(entry => entry.id === post.id) + 1} total={stagePosts.length} onToggle={() => setOpenPost(previous => previous?.stage === active.key && previous.id === post.id ? null : { stage: active.key, id: post.id })} onNavigate={direction => { const next = stagePosts[openPostIndex + direction]; if (next) setOpenPost({ stage: active.key, id: next.id }); }} onEdit={editPost} onDelete={removePost}/>) : <div className="empty-state"><span aria-hidden="true">✳</span><h4>No posts yet</h4><p>Be the first to share your work in this step.</p></div>}</div></section>}
      </>}
      {view === 'admin' && isAdmin && <section className="admin-area"><div className="section-heading"><p className="eyebrow">WORKSHOP MANAGEMENT</p><h2>Admin controls</h2><p>Manage access, accounts, and contributions across all stages.</p></div><div className="admin-section"><h3>Stage visibility</h3><p className="muted">You can always open every stage. Participants see only the stages you enable.</p><div className="visibility-grid">{stages.map(stage => <div className="visibility-card" key={stage.key}><span className="stage-number">{stage.number}</span><strong>{stage.title}</strong><span className={`status-pill ${settings[stage.key] ? 'open' : ''}`}>{settings[stage.key] ? 'Open' : 'Hidden'}</span><button className="secondary" onClick={() => toggle(stage.key)}>{settings[stage.key] ? 'Hide from participants' : 'Open to participants'}</button></div>)}</div></div><div className="admin-section"><h3>Participant accounts</h3><div className="table-wrap"><table className="admin-table"><thead><tr><th>Nickname</th><th>Email</th><th>New password</th><th></th></tr></thead><tbody>{users.map(account => <UserRow key={account.uid} account={account} onSave={editUser}/>)}</tbody></table></div></div><div className="admin-section"><h3>All contributions</h3>{stages.map(stage => <div className="admin-post-group" key={stage.key}><h4>{stage.title} <span>{adminPosts[stage.key].length}</span></h4>{adminPosts[stage.key].map(post => <div className="admin-post" key={post.id}><div><strong>{post.name || post.text?.slice(0, 75) || post.problem?.slice(0, 75) || 'Untitled'}</strong><small>{post.ownerName || post.ownerId} · {post.isPublic ? 'Shared' : 'Private legacy post'}</small></div><div className="actions"><button className="secondary" onClick={() => editPost(stage.key, post)}>Edit</button><button className="danger" onClick={() => removePost(stage.key, post)}>Delete</button></div></div>)}</div>)}</div></section>}
    </div>
    {guideOpen && <AssignmentGuideModal content={content} onClose={() => void closeGuide()} onStart={() => void closeGuide(true)}/>}
  </main>;
}

function AssignmentGuideModal({ content, onClose, onStart }: { content: string; onClose: () => void; onStart: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return <dialog ref={dialogRef} className="guide-dialog" aria-labelledby="guide-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="guide-dialog-header"><div><p className="eyebrow">BEFORE YOU BEGIN</p><h2 id="guide-dialog-title">Pre-work assignment guide</h2><p>Read the task, then share one challenge from your school or teaching context.</p></div><button className="guide-dialog-close" aria-label="Close guide" onClick={onClose}>×</button></div>
    <div className="guide-dialog-content markdown">{content ? <ReactMarkdown>{content}</ReactMarkdown> : <p>The guide is loading. Please try again in a moment.</p>}</div>
    <div className="guide-dialog-footer"><button className="secondary" onClick={onClose}>Back to posts</button><button onClick={onStart}>Write my post →</button></div>
  </dialog>;
}

function UserRow({ account, onSave }: { account: any; onSave: (uid: string, nickname: string, password: string) => void }) {
  const [nickname, setNickname] = useState(account.nickname || '');
  const [password, setPassword] = useState('');
  return <tr><td><input aria-label={`Nickname for ${account.email}`} value={nickname} onChange={e => setNickname(e.target.value)}/></td><td>{account.email}</td><td><input aria-label={`New password for ${account.email}`} type="password" placeholder="Leave blank to keep" value={password} onChange={e => setPassword(e.target.value)}/></td><td><button className="secondary" onClick={() => { onSave(account.uid, nickname, password); setPassword(''); }}>Save</button></td></tr>;
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="m12 9-7 7 7 7m8-14 7 7-7 7m-2-18-4 22" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
}

function PostCard({ stage, post, currentUser, isAdmin, expanded, position, total, onToggle, onNavigate, onEdit, onDelete }: { stage: Stage; post: Post; currentUser: User; isAdmin: boolean; expanded: boolean; position: number; total: number; onToggle: () => void; onNavigate: (direction: -1 | 1) => void; onEdit: (stage: Stage, post: Post) => void; onDelete: (stage: Stage, post: Post) => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [feedback, setFeedback] = useState('');
  const canManage = post.ownerId === currentUser.uid || isAdmin;
  const collectionName = stage === 'prd' ? 'prds' : stage === 'share' ? 'projects' : 'prework';
  useEffect(() => {
    if (!expanded) return;
    return onSnapshot(collection(clientDb(), collectionName, post.id, 'comments'), snapshot => setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [expanded, collectionName, post.id]);
  async function sendFeedback() {
    if (!feedback.trim()) return;
    await addDoc(collection(clientDb(), collectionName, post.id, 'comments'), { text: feedback.trim(), authorId: currentUser.uid, authorName: currentUser.displayName || 'Participant', createdAt: serverTimestamp() });
    setFeedback('');
  }
  async function editFeedback(comment: any) {
    const text = window.prompt('Edit your feedback', comment.text);
    if (text?.trim()) await updateDoc(doc(clientDb(), collectionName, post.id, 'comments', comment.id), { text: text.trim(), updatedAt: serverTimestamp() });
  }
  const title = post.isExample ? 'Example' : stage === 'prework' ? 'Problem statement' : stage === 'prd' ? 'Problem & PRD' : post.name || 'Outcome';
  const excerpt = stage === 'prework' ? post.text : post.problem || post.features || post.guide;
  return <article className={`post-card ${expanded ? 'expanded' : ''}`}>
    <div className="post-card-top"><span className="post-type">{title}</span><span className="post-initial">{(post.ownerName || '?')[0].toUpperCase()}</span></div>
    {expanded && <nav className="reader-navigation" aria-label="Browse posts"><button className="secondary" disabled={position <= 1} onClick={() => onNavigate(-1)}>← Previous post</button><span>{position} / {total}</span><button className="secondary" disabled={position >= total} onClick={() => onNavigate(1)}>Next post →</button></nav>}
    {expanded ? <div className="post-detail">
      {stage === 'prework' && <p>{post.text}</p>}
      {stage === 'prd' && <dl>{([['Problem', post.problem], ['User', post.user], ['Goal', post.goal], ['Core features', post.features]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>}
      {stage === 'share' && <><p>{post.problem}</p><p>{post.features}</p><p>{post.guide}</p>{post.url && <a href={post.url} target="_blank" rel="noopener noreferrer">Open external link ↗</a>}</>}
    </div> : <p className="post-excerpt">{excerpt || 'Open this post to explore the details.'}</p>}
    <div className="post-card-bottom"><span>By <strong>{post.ownerName || 'Participant'}</strong></span><button className="inline-link" onClick={onToggle} aria-expanded={expanded}>{expanded ? 'Close' : 'Read post'} <span aria-hidden="true">↗</span></button></div>
    {expanded && <div className="post-interactions">
      {canManage && <div className="post-tools"><button className="secondary" onClick={() => onEdit(stage, post)}>Edit</button><button className="danger" onClick={() => onDelete(stage, post)}>Delete</button></div>}
      <div className="feedback"><h4>Feedback</h4>{comments.map(comment => <div className="comment" key={comment.id}><p>{comment.text}</p><div><small>{comment.authorName || 'Participant'} · {comment.createdAt?.toDate?.().toLocaleDateString?.() || 'Just now'}</small><span>{(comment.authorId === currentUser.uid || isAdmin) && <button className="inline-link" onClick={() => editFeedback(comment)}>Edit</button>}{(comment.authorId === currentUser.uid || canManage) && <button className="inline-link" onClick={() => deleteDoc(doc(clientDb(), collectionName, post.id, 'comments', comment.id))}>Delete</button>}</span></div></div>)}<div className="feedback-form"><input aria-label="Write feedback" placeholder="Write a thoughtful comment…" value={feedback} onChange={e => setFeedback(e.target.value)}/><button onClick={sendFeedback}>Post</button></div></div>
    </div>}
  </article>;
}
