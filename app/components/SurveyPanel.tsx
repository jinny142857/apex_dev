'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useLanguage } from '@/app/components/LanguageProvider';

type Question = { id: string; prompt: string; type: 'text' | 'single'; options: string[] };
type Response = { uid: string; nickname?: string; answers: { questionId: string; value: string }[]; updatedAt: string };
type Survey = { id: string; title: string; closesAt: string; closed: boolean; templateKey?: string; questions: Question[]; responses: Response[]; myResponse: Response | null };
type Draft = { prompt: string; type: 'text' | 'single'; options: string };
const newQuestion = (): Draft => ({ prompt: '', type: 'text', options: '' });

export default function SurveyPanel({ user, isAdmin }: { user: User; isAdmin: boolean }) {
  const { tr } = useLanguage();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [title, setTitle] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [questions, setQuestions] = useState<Draft[]>([newQuestion()]);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [templateChecked, setTemplateChecked] = useState(false);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const token = await user.getIdToken();
    const response = await fetch(path, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }, [user]);

  const load = useCallback(async () => {
    try {
      const data = await request('/api/surveys');
      setSurveys(data);
      setAnswers(Object.fromEntries(data.map((survey: Survey) => [survey.id, Object.fromEntries((survey.myResponse?.answers || []).map(answer => [answer.questionId, answer.value]))])));
      setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load surveys.'); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer); }, []);

  async function createSurvey(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await request('/api/surveys', { method: 'POST', body: JSON.stringify({ title, closesAt: new Date(closesAt).toISOString(), questions: questions.map(question => ({ prompt: question.prompt, type: question.type, options: question.type === 'single' ? question.options.split('\n').map(option => option.trim()).filter(Boolean) : [] })) }) });
      setTitle(''); setClosesAt(''); setQuestions([newQuestion()]);
      await load(); setMessage('Survey opened.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not open survey.'); }
    finally { setBusy(false); }
  }

  async function submitResponse(survey: Survey) {
    setBusy(true); setMessage('');
    try {
      await request(`/api/surveys/${survey.id}/responses`, { method: 'POST', body: JSON.stringify({ answers: survey.questions.map(question => ({ questionId: question.id, value: answers[survey.id]?.[question.id] || '' })) }) });
      await load(); setMessage('Your response was saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save response.'); }
    finally { setBusy(false); }
  }

  async function setClosed(survey: Survey, closed: boolean) {
    setBusy(true); setMessage('');
    try { await request('/api/surveys', { method: 'PATCH', body: JSON.stringify({ id: survey.id, closed }) }); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update survey.'); }
    finally { setBusy(false); }
  }
  async function addRecommendedSurvey() {
    setBusy(true); setMessage('');
    try {
      const result = await request('/api/surveys/seed', { method: 'POST' }) as { created: boolean };
      await load(); setMessage(result.created ? 'The AI access survey is now open.' : 'The AI access survey is already available.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not add the recommended survey.'); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    if (!isAdmin || loading || templateChecked || surveys.some(survey => survey.templateKey === 'ai-access-v1')) return;
    setTemplateChecked(true);
    void addRecommendedSurvey();
  }, [isAdmin, loading, surveys, templateChecked]);
  return <section className="utility-page"><div className="section-heading"><p className="eyebrow">BEFORE THE WORKSHOP</p><h2>{tr('Survey')}</h2><p>{tr('A quick check-in to help us prepare.')}</p></div>
    {message && <p role="status" className="notice">{message}</p>}
    {isAdmin && <><div className="utility-card survey-template-card"><div><p className="eyebrow">RECOMMENDED SURVEY</p><h3>AI tools & subscriptions</h3><p className="muted">Adds the workshop preparation survey shown in Demo mode. It is created once only and never overwrites responses.</p></div><button className="secondary" disabled={busy || surveys.some(survey => survey.templateKey === 'ai-access-v1')} onClick={() => void addRecommendedSurvey()}>{surveys.some(survey => survey.templateKey === 'ai-access-v1') ? 'Already added' : 'Add recommended survey'}</button></div><form className="utility-card survey-builder" onSubmit={createSurvey}><div className="panel-heading"><div><p className="eyebrow">ADMIN</p><h3>Open a survey</h3></div></div><label htmlFor="survey-title">Title</label><input id="survey-title" required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Workshop check-in"/><label htmlFor="survey-deadline">Response deadline</label><input id="survey-deadline" required type="datetime-local" value={closesAt} onChange={event => setClosesAt(event.target.value)}/><div className="survey-questions">{questions.map((question, index) => <div className="survey-question-editor" key={index}><div className="question-editor-head"><strong>Question {index + 1}</strong>{questions.length > 1 && <button type="button" className="inline-link" onClick={() => setQuestions(previous => previous.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}</div><label htmlFor={`question-${index}`}>Question</label><input id={`question-${index}`} required maxLength={500} value={question.prompt} onChange={event => setQuestions(previous => previous.map((entry, itemIndex) => itemIndex === index ? { ...entry, prompt: event.target.value } : entry))}/><label htmlFor={`question-type-${index}`}>Answer type</label><select id={`question-type-${index}`} value={question.type} onChange={event => setQuestions(previous => previous.map((entry, itemIndex) => itemIndex === index ? { ...entry, type: event.target.value as Draft['type'] } : entry))}><option value="text">Written answer</option><option value="single">Single choice</option></select>{question.type === 'single' && <><label htmlFor={`question-options-${index}`}>Choices (one per line)</label><textarea id={`question-options-${index}`} required value={question.options} onChange={event => setQuestions(previous => previous.map((entry, itemIndex) => itemIndex === index ? { ...entry, options: event.target.value } : entry))} placeholder={'Option 1\nOption 2'}/></>}</div>)}</div><div className="utility-actions"><button type="button" className="secondary" disabled={questions.length >= 12} onClick={() => setQuestions(previous => [...previous, newQuestion()])}>+ Add question</button><button disabled={busy}>Open survey</button></div></form></>}
    <div className="utility-list"><div className="home-section-heading"><h3>All surveys</h3><p>{loading ? tr('Loading…') : `${surveys.length} ${tr('Survey')}`}</p></div>{!loading && !surveys.length && <div className="empty-state"><h4>No surveys yet</h4><p>New surveys will appear here when the administrator opens them.</p></div>}{surveys.map(survey => { const beforeDeadline = now < Date.parse(survey.closesAt); const open = !survey.closed && beforeDeadline; return <article className="utility-card survey-card" key={survey.id}><div className="survey-card-head"><div><span className={`status-pill ${open ? 'open' : ''}`}>{tr(open ? 'Open' : 'Closed')}</span><h3>{tr(survey.title)}</h3><p>{tr('Deadline:')} {new Date(survey.closesAt).toLocaleString()}</p></div>{isAdmin && <button className="secondary" disabled={busy || !beforeDeadline || (!survey.closed && !open)} onClick={() => void setClosed(survey, !survey.closed)}>{survey.closed ? 'Reopen' : 'Close now'}</button>}</div>{isAdmin ? <div className="survey-results"><strong>{survey.responses.length} response{survey.responses.length === 1 ? '' : 's'}</strong>{survey.responses.map(response => <details key={response.uid}><summary>{response.nickname || 'Participant'} · {new Date(response.updatedAt).toLocaleString()}</summary>{survey.questions.map(question => <div key={question.id}><strong>{tr(question.prompt)}</strong><p>{response.answers.find(answer => answer.questionId === question.id)?.value || '—'}</p></div>)}</details>)}</div> : <div className="survey-response">{survey.questions.map(question => <div className="survey-answer" key={question.id}><label htmlFor={`${survey.id}-${question.id}`}>{tr(question.prompt)}</label>{question.type === 'text' ? <textarea id={`${survey.id}-${question.id}`} disabled={!open} value={answers[survey.id]?.[question.id] || ''} onChange={event => setAnswers(previous => ({ ...previous, [survey.id]: { ...previous[survey.id], [question.id]: event.target.value } }))}/> : <select id={`${survey.id}-${question.id}`} disabled={!open} value={answers[survey.id]?.[question.id] || ''} onChange={event => setAnswers(previous => ({ ...previous, [survey.id]: { ...previous[survey.id], [question.id]: event.target.value } }))}><option value="">{tr('Choose one')}</option>{question.options.map(option => <option key={option} value={option}>{tr(option)}</option>)}</select>}</div>)}<div className="utility-actions">{survey.myResponse && <span className="muted">{tr('Response saved')}</span>}{open && <button disabled={busy} onClick={() => void submitResponse(survey)}>{tr(survey.myResponse ? 'Update response' : 'Submit response')}</button>}</div></div>}</article>; })}</div>
  </section>;
}
