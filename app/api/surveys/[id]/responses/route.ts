import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { errorResponse, requireUser } from '@/lib/workshop-auth';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const survey = await adminDb().collection('apexDevSurveys').doc(id).get();
    if (!survey.exists) return NextResponse.json({ error: 'Survey not found.' }, { status: 404 });
    const data = survey.data()!;
    if (data.closed || Date.now() >= Date.parse(data.closesAt)) throw new Error('This survey is closed.');
    const { answers } = await request.json();
    if (!Array.isArray(answers)) throw new Error('Complete every question.');
    const cleaned = (data.questions as { id: string; type: 'text' | 'single'; options: string[] }[]).map(question => {
      const answer = answers.find((entry: { questionId?: string }) => entry.questionId === question.id);
      const value = String(answer?.value || '').trim();
      if (!value || value.length > 3000) throw new Error('Complete every question with a valid response.');
      if (question.type === 'single' && !question.options.includes(value)) throw new Error('Select one of the provided options.');
      return { questionId: question.id, value };
    });
    const profile = await adminDb().collection('users').doc(user.uid).get();
    await survey.ref.collection('responses').doc(user.uid).set({ uid: user.uid, nickname: String(profile.data()?.nickname || 'Participant'), answers: cleaned, updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
