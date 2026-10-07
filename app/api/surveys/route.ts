import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { errorResponse, requireUser } from '@/lib/workshop-auth';

type Question = { id: string; prompt: string; type: 'text' | 'single'; options?: string[] };

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const snapshots = await adminDb().collection('apexDevSurveys').get();
    const surveys = await Promise.all(snapshots.docs.map(async doc => {
      const data = doc.data();
      const responses = user.admin ? (await doc.ref.collection('responses').get()).docs.map(response => response.data()) : [];
      const mine = user.admin ? null : (await doc.ref.collection('responses').doc(user.uid).get()).data() || null;
      return { id: doc.id, ...data, createdAt: String(data.createdAt || ''), responses, myResponse: mine };
    }));
    return NextResponse.json(surveys.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user.admin) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    const body = await request.json();
    const title = String(body.title || '').trim();
    const closesAt = new Date(body.closesAt);
    const questions = body.questions as Question[];
    if (!title || title.length > 120) throw new Error('Enter a survey title of up to 120 characters.');
    if (!Number.isFinite(closesAt.getTime()) || closesAt.getTime() <= Date.now()) throw new Error('Choose a future deadline.');
    if (!Array.isArray(questions) || questions.length < 1 || questions.length > 12) throw new Error('Add 1 to 12 questions.');
    const cleaned = questions.map((question, index) => {
      const prompt = String(question.prompt || '').trim();
      const type = question.type;
      const options = type === 'single' ? (question.options || []).map(option => String(option).trim()).filter(Boolean) : [];
      if (!prompt || prompt.length > 500 || !['text', 'single'].includes(type)) throw new Error(`Check question ${index + 1}.`);
      if (type === 'single' && (options.length < 2 || options.length > 8 || new Set(options).size !== options.length)) throw new Error(`Question ${index + 1} needs 2 to 8 unique options.`);
      if (options.some(option => option.length > 200)) throw new Error(`Keep choices in question ${index + 1} under 200 characters.`);
      return { id: `q${index + 1}`, prompt, type, options };
    });
    const doc = await adminDb().collection('apexDevSurveys').add({ title, closesAt: closesAt.toISOString(), questions: cleaned, closed: false, createdAt: new Date().toISOString(), createdBy: user.uid });
    return NextResponse.json({ ok: true, id: doc.id });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user.admin) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    const { id, closed } = await request.json();
    if (typeof id !== 'string' || typeof closed !== 'boolean') throw new Error('Invalid survey update.');
    const ref = adminDb().collection('apexDevSurveys').doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: 'Survey not found.' }, { status: 404 });
    if (!closed && Date.now() >= Date.parse(snapshot.data()?.closesAt || '')) throw new Error('The deadline has passed. Create a new survey to collect more responses.');
    await ref.update({ closed });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
