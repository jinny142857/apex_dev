import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { errorResponse, requireUser } from '@/lib/workshop-auth';
import { teams, validateFeedback, validateSheet, type EvaluationConfig } from '@/lib/evaluation';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (user.admin) throw new Error('Administrator accounts do not submit peer scores.');
    const settings = await adminDb().collection('settings').doc('site').get();
    if (settings.data()?.evaluation !== true) throw new Error('Evaluation is not open to participants yet.');
    const { round, scores, feedback } = await request.json();
    if (round !== 'final') throw new Error('Only the final pitch is scored.');
    const configRef = adminDb().collection('apexDevEvaluation').doc('config');
    const sheetRef = adminDb().collection('apexDevFinalScores').doc(user.uid);
    await adminDb().runTransaction(async transaction => {
      const [configSnapshot, existing] = await Promise.all([transaction.get(configRef), transaction.get(sheetRef)]);
      if (existing.exists) throw new Error('You have already submitted a score sheet for this round.');
      const config = configSnapshot.data() as EvaluationConfig | undefined;
      if (!config || config.phase !== round) throw new Error('This round is not open.');
      const deadline = config.finalDeadline;
      if (!deadline || Date.now() >= Date.parse(deadline)) throw new Error('The scoring deadline has passed.');
      const ownTeam = config.assignments?.[user.uid];
      if (!ownTeam) throw new Error('Ask the administrator to assign you to a team.');
      const candidates = teams.filter(team => team !== ownTeam && config.finalists?.[team]);
      const rubric = config.finalRubric;
      if (!rubric?.length || !candidates.length) throw new Error('No candidates or rubric are available.');
      const sheet = validateSheet(scores, candidates, rubric);
      const reviewedFeedback = validateFeedback(feedback, candidates);
      transaction.create(sheetRef, { evaluatorUid: user.uid, teamId: ownTeam, ...sheet, feedback: reviewedFeedback, createdAt: new Date().toISOString() });
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
