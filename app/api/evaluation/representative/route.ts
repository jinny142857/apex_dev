import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { errorResponse, requireUser } from '@/lib/workshop-auth';
import { initialEvaluation, type EvaluationConfig } from '@/lib/evaluation';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user.admin) throw new Error('A team participant must submit the representative.');
    const settings = await adminDb().collection('settings').doc('site').get();
    if (settings.data()?.evaluation !== true) throw new Error('Presentation & Evaluation is not open yet.');
    const { outcomeId } = await request.json();
    if (typeof outcomeId !== 'string' || !/^[\w-]{1,128}$/.test(outcomeId)) throw new Error('Choose an individual outcome.');
    const database = adminDb();
    await database.runTransaction(async transaction => {
      const configRef = database.collection('apexDevEvaluation').doc('config');
      const configSnapshot = await transaction.get(configRef);
      const config = { ...initialEvaluation, ...configSnapshot.data() } as EvaluationConfig;
      if (config.phase !== 'team') throw new Error('Team representative submissions are not open.');
      const team = config.assignments[user.uid];
      if (!team) throw new Error('Ask the administrator to assign you to a team.');
      const outcomeRef = database.collection('projects').doc(outcomeId);
      const outcome = await transaction.get(outcomeRef);
      const ownerUid = String(outcome.data()?.ownerId || '');
      if (!outcome.exists || outcome.data()?.isPublic !== true || outcome.data()?.stage !== 'share' || config.assignments[ownerUid] !== team) throw new Error('Choose a shared individual outcome from your own team.');
      transaction.set(database.collection('apexDevTeamRepresentatives').doc(team), { teamId: team, ownerUid, outcomeId, selectedByUid: user.uid, selectedAt: new Date().toISOString() });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
