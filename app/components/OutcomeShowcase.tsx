'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { clientDb } from '@/lib/firebase';
import type { Criterion, ReviewFeedback } from '@/lib/evaluation';
import ReviewDialog from '@/app/components/ReviewDialog';
import { useLanguage } from '@/app/components/LanguageProvider';

export type OutcomePost = { id: string; ownerId: string; ownerName?: string; name?: string; url?: string; problem?: string; features?: string; guide?: string; demoComments?: { id: string; text: string; authorName: string; authorId: string }[]; demoLikes?: string[] };
export type PresentationItem = { post: OutcomePost; label?: string; scoreId?: string };
type ScoreControls = { rubric: Criterion[]; values: Record<string, Record<string, string>>; feedback: Record<string, ReviewFeedback>; onChange: (id: string, criterionId: string, value: string) => void; onFeedback: (id: string, field: keyof ReviewFeedback, value: string) => void; onSubmit: () => void; submitted: boolean; closed: boolean; busy: boolean; error?: string };
type RepresentativePick = { ownRepresentativeId?: string; onPick: (postId: string) => void; busy?: boolean };

function safeUrl(value?: string) {
  try { const url = new URL(value || ''); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
  catch { return ''; }
}
function hostname(value?: string) {
  try { return new URL(value || '').hostname.replace(/^www\./, ''); }
  catch { return 'Shared work'; }
}

export function PresentationMode({ items, initialIndex = 0, title, currentUser, displayName, isAdmin = false, onClose, scoring, representativePick, demo = false, solo = false, active = true, preloadAll = false }: { items: PresentationItem[]; initialIndex?: number; title: string; currentUser: User; displayName: string; isAdmin?: boolean; onClose: () => void; scoring?: ScoreControls; representativePick?: RepresentativePick; demo?: boolean; solo?: boolean; active?: boolean; preloadAll?: boolean }) {
  const { tr } = useLanguage();
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(items.length - 1, 0)));
  const [comments, setComments] = useState<{ id: string; text?: string; authorName?: string; authorId?: string }[]>([]);
  const [comment, setComment] = useState('');
  const [likes, setLikes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [readyFrames, setReadyFrames] = useState<Record<string, boolean>>({});
  const [stalledFrame, setStalledFrame] = useState('');
  const shellRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = items[index];
  const post = item?.post;
  const url = safeUrl(post?.url);
  const previewKey = `${post?.id || ''}:${url}`;
  const frameReady = !!readyFrames[previewKey];
  const canRate = !!scoring && !scoring.submitted && !scoring.closed && !!item?.scoreId;
  const rated = canRate && scoring.rubric.every(criterion => scoring.values[item.scoreId!]?.[criterion.id] !== undefined && scoring.values[item.scoreId!]?.[criterion.id] !== '');
  const scoreTargets = items.filter(entry => entry.scoreId);
  const readyToSubmit = !!scoring && scoreTargets.length > 0 && scoreTargets.every(entry => scoring.rubric.every(criterion => scoring.values[entry.scoreId!]?.[criterion.id] !== undefined && scoring.values[entry.scoreId!]?.[criterion.id] !== ''));

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, [active]);
  useEffect(() => {
    if (active) setIndex(Math.min(initialIndex, Math.max(items.length - 1, 0)));
  }, [active, initialIndex, items.length]);
  useEffect(() => {
    if (!active) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (ratingOpen) setRatingOpen(false); else onClose(); }
      if (ratingOpen) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowRight') setIndex(current => Math.min(current + 1, items.length - 1));
      if (event.key === 'ArrowLeft') setIndex(current => Math.max(current - 1, 0));
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [active, items.length, onClose, ratingOpen]);
  useEffect(() => {
    if (!active || !url || frameReady) return;
    const timeout = window.setTimeout(() => setStalledFrame(previewKey), 12000);
    return () => window.clearTimeout(timeout);
  }, [active, url, frameReady, previewKey]);
  useEffect(() => {
    if (!post) return;
    if (demo) { setComments(post.demoComments || []); return; }
    return onSnapshot(collection(clientDb(), 'projects', post.id, 'comments'), snapshot => setComments(snapshot.docs.filter(entry => !(entry.data() as { isArchived?: boolean }).isArchived).map(entry => ({ id: entry.id, ...entry.data() }))), () => setError('Could not load comments.'));
  }, [post, demo]);
  useEffect(() => {
    if (!post) return;
    if (demo) { setLikes(post.demoLikes || []); return; }
    return onSnapshot(collection(clientDb(), 'projects', post.id, 'likes'), snapshot => setLikes(snapshot.docs.map(entry => entry.id)), () => setError('Could not load likes.'));
  }, [post, demo]);
  const liked = likes.includes(currentUser.uid);
  async function toggleLike() {
    if (!post) return;
    if (demo) { setLikes(previous => liked ? previous.filter(id => id !== currentUser.uid) : [...previous, currentUser.uid]); return; }
    try {
      const ref = doc(clientDb(), 'projects', post.id, 'likes', currentUser.uid);
      if (liked) await deleteDoc(ref); else await setDoc(ref, { authorName: displayName, createdAt: serverTimestamp() });
    } catch { setError('Could not update your like.'); }
  }

  async function submitComment() {
    if (!post || !comment.trim()) return;
    setPosting(true); setError('');
    try {
      if (demo) setComments(previous => [...previous, { id: `demo-${Date.now()}`, text: comment.trim(), authorId: currentUser.uid, authorName: displayName }]);
      else await addDoc(collection(clientDb(), 'projects', post.id, 'comments'), { text: comment.trim(), authorId: currentUser.uid, authorName: displayName, createdAt: serverTimestamp() });
      setComment('');
    } catch { setError('Could not post your comment.'); }
    finally { setPosting(false); }
  }
  async function editComment(commentId: string, currentText: string) {
    if (!post) return;
    const next = window.prompt('Edit your comment', currentText);
    if (!next?.trim()) return;
    try { if (demo) setComments(previous => previous.map(entry => entry.id === commentId ? { ...entry, text: next.trim() } : entry)); else await updateDoc(doc(clientDb(), 'projects', post.id, 'comments', commentId), { text: next.trim(), updatedAt: serverTimestamp() }); }
    catch { setError('Could not edit the comment.'); }
  }

  if (!post) return null;
  return <div ref={shellRef} className={`presentation-shell ${solo ? 'presentation-solo' : ''} ${minimized ? 'presentation-minimized' : ''} ${maximized ? 'presentation-maximized' : ''} ${!active ? 'presentation-preloading' : ''}`} role={active ? 'dialog' : undefined} aria-modal={active ? true : undefined} aria-label={active ? title : undefined} aria-hidden={!active} inert={!active}>
    <header className="presentation-topbar"><div className="presentation-window-title"><span className="presentation-kicker">APEX DEV · PRESENTATION MODE</span><h2>{title}</h2></div><div className="presentation-top-actions">{solo && <button className="secondary" onClick={onClose}>← {tr('Back to works')}</button>}{!solo && <button className="secondary presentation-rail-toggle" onClick={() => setRailCollapsed(value => !value)} aria-expanded={!railCollapsed}>{tr(railCollapsed ? 'Show works' : 'Hide works')}</button>}<span>{index + 1} / {items.length}</span></div></header>
    <div className={`presentation-layout ${railCollapsed || solo ? "rail-collapsed" : ""}`}>
      {!solo && <aside className="presentation-rail" aria-label="Choose a work" hidden={railCollapsed}>{items.map((entry, position) => <button key={entry.post.id} className={`presentation-thumbnail ${position === index ? 'selected' : ''}`} onClick={() => setIndex(position)}><span className="presentation-thumb-art" aria-hidden="true">{String(position + 1).padStart(2, "0")}</span><span>{entry.label || `Work ${position + 1}`}</span><strong>{entry.post.name || 'Untitled outcome'}</strong><small>{entry.post.ownerName || 'Participant'}</small></button>)}</aside>}
      <section className="presentation-main"><div className="presentation-browser">
          <div className="presentation-browser-bar">
            <span className="presentation-window-controls" aria-label="Window controls">
              <button ref={closeRef} className="window-dot window-close" onClick={onClose} title={tr('Close window')} aria-label={tr('Close window')}>×</button>
              <button className="window-dot window-minimize" onClick={() => setMinimized(value => !value)} title={tr(minimized ? 'Restore window' : 'Minimize window')} aria-label={tr(minimized ? 'Restore window' : 'Minimize window')}>−</button>
              <button className="window-dot window-maximize" onClick={() => { if (document.fullscreenElement) { void document.exitFullscreen(); setMaximized(false); } else { void shellRef.current?.requestFullscreen?.().then(() => setMaximized(true)).catch(() => setMaximized(true)); } }} title={tr('Maximize window')} aria-label={tr('Maximize window')}>↗</button>
            </span>
            <span className="presentation-browser-title">{post.name || 'Live preview'}</span>
            {url && <a className="presentation-open-site" href={url} target="_blank" rel="noreferrer">Open site ↗</a>}
          </div>
          {url ? <div className="presentation-frame-stage">
            {(preloadAll ? items : [item]).map(entry => { const frameUrl = safeUrl(entry.post.url); const frameKey = `${entry.post.id}:${frameUrl}`; return frameUrl && <iframe key={frameKey} className={`${frameKey === previewKey ? 'is-active' : ''} ${!readyFrames[frameKey] ? 'is-loading' : ''}`} src={frameUrl} title={`Preview of ${entry.post.name || 'outcome'}`} loading="eager" sandbox={demo ? undefined : 'allow-forms allow-scripts allow-same-origin allow-popups'} referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onLoad={() => setReadyFrames(previous => ({ ...previous, [frameKey]: true }))}/>; })}
            {!frameReady && <div className="presentation-frame-pending" role="status"><span aria-hidden="true">✦</span><strong>{post.name || 'Live preview'}</strong><small>{stalledFrame === previewKey ? 'This site is not responding inside the preview.' : 'Opening site…'}</small></div>}
          </div> : <div className="presentation-no-preview"><span aria-hidden="true">✳</span><h3>{post.name || 'Shared outcome'}</h3><p>{post.features || post.problem || 'This work has no website link.'}</p></div>}
        </div>{solo && <div className="presentation-solo-navigation"><button disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="Previous work">←</button><button disabled={index === items.length - 1} onClick={() => setIndex(index + 1)} aria-label="Next work">→</button></div>}<div className="presentation-caption"><div><span className="eyebrow">{item.label || 'INDIVIDUAL OUTCOME'}</span><h3>{post.name || 'Untitled outcome'}</h3><p>By {post.ownerName || 'Participant'}</p>{(post.problem || post.features || post.guide) && <details className="presentation-about"><summary>About this work</summary>{post.problem && <p><strong>Challenge:</strong> {post.problem}</p>}{post.features && <p><strong>What it does:</strong> {post.features}</p>}{post.guide && <p><strong>Notes:</strong> {post.guide}</p>}</details>}</div><div className="presentation-nav"><button className={`like-button ${liked ? 'liked' : ''}`} onClick={() => void toggleLike()} aria-pressed={liked} aria-label={liked ? 'Unlike this work' : 'Like this work'}>{liked ? '♥' : '♡'} {likes.length}</button>{canRate && <button className="presentation-rate-button" onClick={() => setRatingOpen(true)}>{rated ? 'Edit review' : 'Evaluate'}</button>}<button className="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label="Previous work">←</button><button className="secondary" disabled={index === items.length - 1} onClick={() => setIndex(index + 1)} aria-label="Next work">→</button></div></div></section>
      <aside className="presentation-sidebar">{representativePick && <section className="presentation-score presentation-representative"><div className="presentation-side-heading"><h3>Team representative</h3></div>{representativePick.ownRepresentativeId === post.id ? <p className="representative-confirmed">✓ This is your team's representative.</p> : <><p>Discuss as a team, then confirm the one work that should present for you.</p><button disabled={representativePick.busy} onClick={() => representativePick.onPick(post.id)}>Select as our representative</button></>}</section>}{scoring && <section className="presentation-score"><div className="presentation-side-heading"><h3>Your evaluation</h3></div><p>{scoring.submitted ? 'Scores submitted privately.' : scoring.closed ? 'Scoring has closed.' : `${scoreTargets.filter(entry => scoring.rubric.every(criterion => scoring.values[entry.scoreId!]?.[criterion.id] !== undefined && scoring.values[entry.scoreId!]?.[criterion.id] !== '')).length} / ${scoreTargets.length} other teams reviewed`}</p>{canRate && <button className="presentation-rate-button" onClick={() => setRatingOpen(true)}>{rated ? 'Edit review' : 'Evaluate'}</button>}{!scoring.submitted && !scoring.closed && <button disabled={!readyToSubmit || scoring.busy} onClick={scoring.onSubmit}>Submit all scores</button>}{scoring.error && <p role="status" className="presentation-error">{scoring.error}</p>}</section>}
        <section className="presentation-comments"><div className="presentation-side-heading"><h3>Comments</h3><span>{comments.length}</span></div><div className="presentation-comment-list">{comments.length ? comments.map(entry => <div className="presentation-comment" key={entry.id}><strong>{entry.authorName || 'Participant'}</strong><p>{entry.text}</p>{(entry.authorId === currentUser.uid || isAdmin) && <button className="inline-link" onClick={() => void editComment(entry.id, entry.text || '')}>Edit</button>}{(entry.authorId === currentUser.uid || post.ownerId === currentUser.uid || isAdmin) && <button className="inline-link" onClick={() => demo ? setComments(previous => previous.filter(item => item.id !== entry.id)) : void updateDoc(doc(clientDb(), 'projects', post.id, 'comments', entry.id), { isArchived: true, archivedAt: serverTimestamp(), archivedBy: currentUser.uid }).catch(() => setError('Could not remove the comment.'))}>Remove</button>}</div>) : <p className="muted">No comments yet. Start the conversation.</p>}</div><div className="presentation-comment-form"><label htmlFor="presentation-comment">Add a comment</label><textarea id="presentation-comment" placeholder="Share a thoughtful response…" value={comment} onChange={event => setComment(event.target.value)}/><button disabled={posting || !comment.trim()} onClick={() => void submitComment()}>Post comment</button>{error && <p role="status">{error}</p>}</div></section>
      </aside>
    </div>
    {ratingOpen && canRate && <ReviewDialog team={item.scoreId!} title={post.name || "Untitled outcome"} rubric={scoring!.rubric} values={scoring!.values[item.scoreId!] || {}} feedback={scoring!.feedback[item.scoreId!] || { strength: "", suggestion: "" }} onScore={(criterionId, value) => scoring!.onChange(item.scoreId!, criterionId, value)} onFeedback={(field, value) => scoring!.onFeedback(item.scoreId!, field, value)} onClose={() => setRatingOpen(false)}/>}
  </div>;
}

function LikeCount({ postId, demo, demoCount = 0 }: { postId: string; demo?: boolean; demoCount?: number }) {
  const [count, setCount] = useState(demo ? demoCount : 0);
  useEffect(() => {
    if (demo) { setCount(demoCount); return; }
    return onSnapshot(collection(clientDb(), 'projects', postId, 'likes'), snapshot => setCount(snapshot.size));
  }, [postId, demo, demoCount]);
  return <span className="like-count" aria-label={`${count} likes`}>♥ {count}</span>;
}

export type TeamPick = { team: string; assignments: Record<string, string>; ownRepresentativeId?: string; busy?: boolean; onPick: (postId: string) => void };

export default function OutcomeShowcase({ posts, currentUser, displayName, isAdmin, onEdit, onDelete, onNewPost, demo = false, teamPick }: { posts: OutcomePost[]; currentUser: User; displayName: string; isAdmin: boolean; onEdit: (post: OutcomePost) => void; onDelete: (post: OutcomePost) => void; onNewPost: () => void; onOpenEvaluation?: () => void; demo?: boolean; teamPick?: TeamPick }) {
  const [start, setStart] = useState<number | null>(null);
  const items = posts.map(post => ({ post }));
  return <section className="outcome-board">
    {teamPick && <div className="team-pick-banner"><strong>Team {teamPick.team} · choose your representative</strong><p>Agree on one as a team, then select it below. Only your own team's work can be picked.</p></div>}
    <div className="outcome-board-heading"><div><h3>Individual outcomes <span>{posts.length}</span></h3></div>{demo && <div className="outcome-toolbar-actions"><button className="secondary" onClick={onNewPost}>＋ Submit work</button></div>}</div>
    {posts.length ? <div className="outcome-gallery">{posts.map((post, index) => { const isOwnTeam = !!teamPick && teamPick.assignments[post.ownerId] === teamPick.team; const isPicked = isOwnTeam && teamPick!.ownRepresentativeId === post.id; return <article className={`outcome-tile outcome-tile-${index % 4} ${isPicked ? 'team-pick-selected' : ''}`} key={post.id}><button className="outcome-tile-preview" onClick={() => setStart(index)} aria-label={`Present ${post.name || 'outcome'}`}><span className="outcome-tile-art" aria-hidden="true"><b>{String(index + 1).padStart(2, '0')}</b><i>{(post.name || 'W').slice(0, 1)}</i></span><span className="outcome-preview-host">{hostname(post.url)}</span></button><div className="outcome-tile-body"><span className="eyebrow">INDIVIDUAL WORK</span><h4>{post.name || 'Untitled outcome'}</h4><p>{post.features || post.problem || 'Explore this shared work.'}</p><div className="outcome-tile-footer"><span>By {post.ownerName || 'Participant'}</span><LikeCount postId={post.id} demo={demo} demoCount={post.demoLikes?.length}/><button className="inline-link" onClick={() => setStart(index)}>View work →</button></div>{isOwnTeam && (isPicked ? <p className="team-pick-confirmed">✓ Our representative</p> : <button className="secondary team-pick-button" disabled={teamPick!.busy} onClick={() => teamPick!.onPick(post.id)}>Select as our representative</button>)}{(isAdmin || post.ownerId === currentUser.uid) && <div className="outcome-tile-tools"><button className="inline-link" onClick={() => onEdit(post)}>Edit</button><button className="inline-link" onClick={() => onDelete(post)}>Remove</button></div>}</div></article>; })}</div> : <div className="empty-state"><span aria-hidden="true">✳</span><h4>No outcomes yet</h4><p>Be the first to share your final work.</p></div>}
    {(demo || start !== null) && posts.length > 0 && <PresentationMode items={items} initialIndex={start ?? 0} title="Individual outcomes" currentUser={currentUser} displayName={displayName} isAdmin={isAdmin} demo={demo} solo active={start !== null} preloadAll={demo} onClose={() => setStart(null)}/>}
  </section>;
}
