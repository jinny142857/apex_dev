import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { errorResponse, requireUser } from '@/lib/workshop-auth';

const templateKey = 'ai-access-v1';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user.admin) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

    const surveys = adminDb().collection('apexDevSurveys');
    const existing = await surveys.where('templateKey', '==', templateKey).limit(1).get();
    if (!existing.empty) return NextResponse.json({ ok: true, id: existing.docs[0].id, created: false });

    const closesAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const document = await surveys.add({
      title: 'AI tools & subscriptions',
      templateKey,
      closesAt,
      closed: false,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      questions: [
        { id: 'q1', prompt: 'Which AI tools do you currently use?', type: 'text', options: [] },
        { id: 'q2', prompt: 'Do you have access to a paid AI account?', type: 'single', options: ['I pay for one or more plans', 'My school provides access', 'I use free plans only', 'I am not sure'] },
        { id: 'q3', prompt: 'If yes, which paid tools or plans?', type: 'text', options: [] },
        { id: 'q4', prompt: 'What would you like to try with AI during the workshop?', type: 'text', options: [] },
      ],
    });
    return NextResponse.json({ ok: true, id: document.id, created: true });
  } catch (error) { return errorResponse(error); }
}
