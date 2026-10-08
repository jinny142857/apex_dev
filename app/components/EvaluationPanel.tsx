'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { teams, type Criterion, type EvaluationConfig, type ReviewFeedback, type Team } from '@/lib/evaluation';
import { officialCriteria } from '@/lib/review-rubric';
import { PresentationMode, type OutcomePost, type PresentationItem } from '@/app/components/OutcomeShowcase';
import AwardsCeremony from '@/app/components/AwardsCeremony';
import WorkshopIcon from '@/app/components/WorkshopIcon';
import PresentationOrder from '@/app/components/PresentationOrder';
import { useLanguage } from '@/app/components/LanguageProvider';

type Member = { uid: string; nickname: string };
type Rank = { id: string; average: number; total: number; reviews: number; maxScore: number };
type Representative = { teamId: Team; ownerUid: string; outcomeId: string; selectedByUid: string; selectedAt: string };
type Evaluation = { config: EvaluationConfig; members: Member[]; outcomeOwners: string[]; representatives: Partial<Record<Team, Representative>>; myFinalSheet: { submitted: true } | null; finalRankings: Rank[]; finalSubmissionCount?: number; individualScores?: { uid: string; nickname: string; teamId: Team | null; scores: Partial<Record<Team, number | null>> }[] };

export default function EvaluationPanel({ user, isAdmin, displayName, outcomes, onOpenOutcomes }: { user: User; isAdmin: boolean; displayName: string; outcomes: OutcomePost[]; onOpenOutcomes: () => void }) {
  const { tr } = useLanguage();
  const [data, setData] = useState<Evaluation | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Team>>({});
  const [finalDeadline, setFinalDeadline] = useState('');
  const [winner, setWinner] = useState<Team | ''>('');
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({});
  const [feedback, setFeedback] = useState<Record<string, ReviewFeedback>>({});
  const [presentation, setPresentation] = useState<PresentationItem[] | null>(null);
  const [presentationTitle, setPresentationTitle] = useState('Presentation');
  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyWatched, setCeremonyWatched] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const token = await user.getIdToken();
    const response = await fetch(path, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed.');
    return result;
  }, [user]);
  const load = useCallback(async () => {
    try {
      const result = await request('/api/evaluation') as Evaluation;
      setData(result); setAssignments(result.config.assignments || {});
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load evaluation.'); }
  }, [request]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer); }, []);

  async function adminAction(action: string, fields: Record<string, unknown> = {}) {
    setBusy(true); setMessage('');
    try { await request('/api/evaluation', { method: 'PATCH', body: JSON.stringify({ action, ...fields }) }); await load(); setMessage('Evaluation updated.'); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update evaluation.'); return false; }
    finally { setBusy(false); }
  }
  async function confirmWinnerAndCelebrate() {
    if (await adminAction('closeFinal', { winnerTeamId: winner })) setShowCeremony(true);
  }
  async function submitScores(candidates: Team[], criteria: Criterion[]) {
    const sheet: Record<string, Record<string, number>> = {};
    for (const team of candidates) {
      sheet[team] = {};
      for (const criterion of criteria) {
        const value = scores[team]?.[criterion.id];
        if (value === undefined || value === '' || !Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > criterion.maxScore) {
          setMessage('Score every other team on every criterion before submitting.'); return;
        }
        sheet[team][criterion.id] = Number(value);
      }
    }
    if (!window.confirm('Submit your final pitch reviews? This cannot be changed afterward.')) return;
    setBusy(true); setMessage('');
    try { await request('/api/evaluation/score', { method: 'POST', body: JSON.stringify({ round: 'final', scores: sheet, feedback }) }); await load(); setMessage('Your reviews were submitted.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not submit scores.'); }
    finally { setBusy(false); }
  }

  if (!data) return <section className="utility-page"><div className="section-heading"><p className="eyebrow">STEP 04 / 04</p><h2>Presentation & Evaluation</h2></div><p className="muted">Loading presentations…</p>{message && <p role="status" className="notice">{message}</p>}</section>;
  const { config, members } = data;
  const ownTeam = config.assignments[user.uid];
  const nameOf = (uid?: string) => members.find(member => member.uid === uid)?.nickname || 'Participant';
  const finalistsReady = teams.every(team => !!config.finalists[team]);
  const eligibleTeams = teams.filter(team => team !== ownTeam && config.finalists[team]);
  const topFinal = Math.max(0, ...data.finalRankings.filter(rank => rank.reviews).map(rank => rank.average));
  const phaseTitle = tr({ setup: 'Preparing teams', team: 'Representative selection', final: 'Final pitches & scoring', closed: 'Final award' }[config.phase]);
  const ownRepresentative = ownTeam ? data.representatives[ownTeam] : undefined;

  function presentFinalists() {
    const order = config.presentationOrder?.length === teams.length ? config.presentationOrder : [...teams];
    const items = order.map(team => ({ team, post: outcomes.find(post => post.id === data?.representatives[team]?.outcomeId) })).filter((entry): entry is { team: Team; post: OutcomePost } => !!entry.post).map(({ team, post }) => ({ post, label: `Team ${team} · ${nameOf(config.finalists[team])}`, scoreId: !isAdmin && ownTeam !== team ? team : undefined }));
    if (items.length !== teams.length) { setMessage('Presenter outcomes are still loading. Please try again shortly.'); return; }
    setPresentation(items); setPresentationTitle('Final pitch presentation');
  }
  function rubricEditor() {
    return <div className="utility-card official-rubric-card"><div className="result-heading"><div><p className="eyebrow">FINAL REVIEW · 20 POINTS</p><h3>Peer-review rubric</h3></div><span className="status-pill open">4 criteria · 1–5 each</span></div><div className="official-rubric-grid">{officialCriteria.map((criterion, index) => <span key={criterion.id}><b>{String(index + 1).padStart(2, '0')}</b>{criterion.label}</span>)}</div></div>;
  }
  function finalRankings() {
    if (!data) return null;
    const ranks = data.finalRankings;
    const rankFor = (rank: Rank) => rank.reviews ? ranks.findIndex(item => item.average === rank.average) + 1 : '—';
    return <div className="utility-card"><div className="result-heading"><div><h3>Final scores and rankings</h3><p className="muted">Only administrators can see these numbers. Participant-facing results show the winning team only.</p></div><span className="status-pill open">{data.finalSubmissionCount || 0} submitted</span></div>{ranks.some(rank => rank.reviews) ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Rank</th><th>Team / presenter</th><th>Average</th><th>Reviews</th></tr></thead><tbody>{ranks.map(rank => <tr key={rank.id}><td>{rankFor(rank)}</td><td>Team {rank.id} · {nameOf(config.finalists[rank.id as Team])}</td><td>{rank.reviews ? rank.average.toFixed(2) : '—'} / {rank.maxScore}</td><td>{rank.reviews}</td></tr>)}</tbody></table></div> : <p className="muted">No scores submitted yet.</p>}{config.phase === 'closed' && !config.finalResultsPublished && <div className="utility-actions"><button disabled={busy} onClick={() => { if (window.confirm('Publish the winning team only? Scores and rankings remain private.')) void adminAction('publishResults', { round: 'final' }); }}>Publish winning team</button></div>}</div>;
  }

  function individualScoreSheets() {
    if (!data) return null;
    return <div className="utility-card"><div className="result-heading"><h3>Individual score sheets</h3><span className="status-pill open">{data.individualScores?.length || 0} / {members.length} people</span></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Participant</th><th>Own team</th>{teams.map(team => <th key={team}>Team {team}</th>)}</tr></thead><tbody>{members.map(member => { const sheet = data.individualScores?.find(entry => entry.uid === member.uid); return <tr key={member.uid}><td>{member.nickname}</td><td>{config.assignments[member.uid] || '—'}</td>{teams.map(team => <td key={team}>{config.assignments[member.uid] === team ? 'Own team' : sheet?.scores[team] == null ? '—' : `${sheet.scores[team]} pts`}</td>)}</tr>; })}</tbody></table></div></div>;
  }

  return <section className="utility-page"><div className="section-heading evaluation-heading"><div className="evaluation-heading-icon"><WorkshopIcon name="trophy"/></div><div><p className="eyebrow">STEP 04 / 04 · {phaseTitle.toUpperCase()}</p><h2>Presentation & Evaluation</h2></div><button className="secondary evaluation-refresh" onClick={() => void load()}>Refresh</button></div>{message && <p role="status" className="notice">{message}</p>}
    {isAdmin && config.phase === 'setup' && <p className="notice">Open Final outcomes to participants in Admin controls before selecting representatives.</p>}
    {isAdmin && config.phase === 'setup' && <div className="utility-card"><h3>Assign participants to four teams</h3><p className="muted">Assignments lock once team sharing opens. Every participant needs a team, with at least two people per team.</p><div className="team-assignment-grid">{members.map(member => <label className="team-assignment" key={member.uid}><span>{member.nickname}</span><select value={assignments[member.uid] || ''} onChange={event => setAssignments(previous => ({ ...previous, [member.uid]: event.target.value as Team }))}><option value="">Unassigned</option>{teams.map(team => <option key={team} value={team}>Team {team}</option>)}</select></label>)}</div>{!members.length && <p>No participant accounts yet.</p>}<div className="utility-actions"><button className="secondary" disabled={busy} onClick={() => void adminAction('assign', { assignments })}>Save teams</button><button disabled={busy} onClick={() => void adminAction('openTeam')}>Open team sharing</button></div></div>}
    {isAdmin && ['setup', 'team'].includes(config.phase) && rubricEditor()}
    {config.phase === 'team' && <div className="utility-card"><div className="result-heading"><div><p className="eyebrow">TEAM DECISION</p><h3>Choose one team representative</h3><p className="muted">Share your work with your team in person, agree on one, then confirm it from the Final outcomes page — anyone on the team can select it there.</p></div><span className="status-pill open">{teams.filter(team => data.representatives[team]).length} / 4 ready</span></div><div className="result-grid">{teams.map(team => { const entry = data.representatives[team]; const post = outcomes.find(outcome => outcome.id === entry?.outcomeId); return <div className={`team-result ${ownTeam === team ? 'my-team-result' : ''}`} key={team}><span className="representative-symbol" aria-hidden="true">{entry ? '✦' : '○'}</span><h4>Team {team}{ownTeam === team && <em>Your team</em>}</h4><strong>{post?.name || (entry ? nameOf(entry.ownerUid) : 'To be selected')}</strong><small>{entry ? `Confirmed by ${nameOf(entry.selectedByUid)} · presenter: ${nameOf(entry.ownerUid)}` : 'Discuss, then select one work'}</small></div>; })}</div><button className="secondary" onClick={onOpenOutcomes}>{tr('Go to Final outcomes')} →</button></div>}
    {isAdmin && config.phase === 'team' && <div className="utility-card"><p className="eyebrow">AFTER TEAM SUBMISSIONS</p><h3>Open final pitches</h3><p className="muted">Teams submit their own agreed representatives. All four submissions and a rubric are required.</p><div className="draw-order"><div>{config.presentationOrder?.length === teams.length ? <PresentationOrder order={config.presentationOrder}/> : <p>Draw a random order before the final round.</p>}</div><button className="secondary" disabled={busy} onClick={() => void adminAction("drawOrder")}>{config.presentationOrder ? "Draw again" : "Draw order"}</button></div><label htmlFor="final-deadline">Final scoring deadline</label><input id="final-deadline" type="datetime-local" value={finalDeadline} onChange={event => setFinalDeadline(event.target.value)}/><div className="utility-actions"><button disabled={busy || !finalDeadline || !config.finalRubric.length || teams.some(team => !data.representatives[team])} onClick={() => void adminAction('openFinal', { deadline: new Date(finalDeadline).toISOString() })}>Open final scoring</button></div></div>}
    {['final', 'closed'].includes(config.phase) && <div className="final-pitch-toolbar"><span>4 final pitches</span><button disabled={!finalistsReady || !outcomes.length} onClick={presentFinalists}>▣ Start presentation</button></div>}
    {!isAdmin && config.phase === 'final' && <div className="utility-card"><h3>Your final score sheet</h3><p className="muted">{data.myFinalSheet ? 'Submitted. Your individual scores are private.' : ownTeam ? `You will score the ${eligibleTeams.length} teams other than Team ${ownTeam} in presentation mode.` : 'Ask the administrator to assign you to a team.'}</p>{!data.myFinalSheet && <button className="secondary" disabled={!ownTeam} onClick={presentFinalists}>Open presentation & score →</button>}</div>}
    {isAdmin && ['final', 'closed'].includes(config.phase) && finalRankings()}
    {isAdmin && ['final', 'closed'].includes(config.phase) && individualScoreSheets()}
    {isAdmin && config.phase === 'final' && <div className="utility-card"><h3>Confirm the winner & celebrate</h3><p className="muted">After the deadline, choose the top-scoring team and go straight into the award ceremony. Ties are resolved by the administrator.</p><label htmlFor="winning-team">Winning team</label><select id="winning-team" value={winner} onChange={event => setWinner(event.target.value as Team)}><option value="">Choose a top-scoring team</option>{data.finalRankings.filter(rank => rank.reviews && rank.average === topFinal).map(rank => <option key={rank.id} value={rank.id}>Team {rank.id} · {rank.average.toFixed(2)} pts</option>)}</select><div className="utility-actions"><button disabled={busy || !winner || now < Date.parse(config.finalDeadline || '')} onClick={() => void confirmWinnerAndCelebrate()}>🏆 Confirm & launch the celebration</button></div></div>}
    {isAdmin && ['final', 'closed'].includes(config.phase) && !config.teamResultsPublished && <div className="utility-card"><h3>Team representatives</h3><p>Only the four confirmed representatives will be shown to participants when you publish.</p><div className="utility-actions"><button disabled={busy} onClick={() => void adminAction('publishResults', { round: 'team' })}>Publish representatives</button></div></div>}
    {config.teamResultsPublished && <div className="utility-card"><p className="eyebrow">TEAM REPRESENTATIVES</p><h3>Presenting in the final round</h3><div className="result-grid">{(config.presentationOrder?.length === teams.length ? config.presentationOrder : [...teams]).map((team, index) => <div className="team-result" key={team}><h4>{index + 1}. Team {team}</h4><strong>{nameOf(config.finalists[team])}</strong></div>)}</div></div>}
    {config.phase === 'closed' && (config.finalResultsPublished
      ? <div className="utility-card winner-card"><p className="eyebrow">FINAL AWARD</p><h3>Team {config.winnerTeamId}</h3><p>The award belongs to every member of Team {config.winnerTeamId}.</p><button onClick={() => setShowCeremony(true)}>✦ Launch the celebration</button></div>
      : isAdmin
        ? <div className="utility-card winner-card winner-card-pending"><p className="eyebrow">FINAL AWARD</p><h3>{ceremonyWatched ? 'Celebration complete' : 'Ready to celebrate'}</h3><p>Kept hidden here — this screen may be projected to the room. The team name only appears inside the ceremony reveal.</p><button onClick={() => setShowCeremony(true)}>✦ {ceremonyWatched ? 'Replay' : 'Launch'} the celebration</button>{ceremonyWatched && <p className="muted">Publish it below so participants can see the result on their own screens too.</p>}</div>
        : <div className="utility-card"><h3>Final scoring is complete</h3><p>The winning team will appear when the administrator publishes it.</p></div>)}
    {presentation && <PresentationMode items={presentation} title={presentationTitle} currentUser={user} displayName={displayName} isAdmin={isAdmin} onClose={() => setPresentation(null)} scoring={presentationTitle === 'Final pitch presentation' && !isAdmin && !!ownTeam && config.phase === 'final' ? { rubric: config.finalRubric, values: scores, feedback, onFeedback: (id, field, value) => setFeedback(previous => ({ ...previous, [id]: { ...(previous[id] || { strength: "", suggestion: "" }), [field]: value } })), onChange: (id, criterionId, value) => { setMessage(''); setScores(previous => ({ ...previous, [id]: { ...(previous[id] || {}), [criterionId]: value } })); }, onSubmit: () => void submitScores(eligibleTeams, config.finalRubric), submitted: !!data.myFinalSheet, closed: now >= Date.parse(config.finalDeadline || ''), busy, error: message } : undefined}/>}
    {showCeremony && config.winnerTeamId && <AwardsCeremony team={config.winnerTeamId} presenter={nameOf(config.finalists[config.winnerTeamId])} members={members.filter(member => config.assignments[member.uid] === config.winnerTeamId).map(member => member.nickname)} onClose={() => setShowCeremony(false)} onReveal={() => setCeremonyWatched(true)}/>}
  </section>;
}
