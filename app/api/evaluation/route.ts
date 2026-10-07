import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { errorResponse, requireUser } from '@/lib/workshop-auth';
import { initialEvaluation, rankings, teams, type EvaluationConfig, type ScoreSheet, type Team } from '@/lib/evaluation';
import { officialCriteria } from '@/lib/review-rubric';
import { randomInt } from 'node:crypto';

const configRef = () => adminDb().collection('apexDevEvaluation').doc('config');
const scoresRef = () => adminDb().collection('apexDevFinalScores');
const representativesRef = () => adminDb().collection('apexDevTeamRepresentatives');
const validDeadline = (value: unknown) => {
  const parsed = new Date(String(value));
  if (!Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now()) throw new Error('Choose a future deadline.');
  return parsed.toISOString();
};
async function participants() {
  const snapshot = await adminDb().collection('users').get();
  return snapshot.docs.filter(doc => doc.data().role === 'participant').map(doc => ({ uid: doc.id, nickname: String(doc.data().nickname || 'Participant') }));
}
async function outcomeOwners() {
  const snapshot = await adminDb().collection('projects').get();
  return [...new Set(snapshot.docs.filter(doc => doc.data().isPublic === true && doc.data().stage !== 'practice').map(doc => String(doc.data().ownerId || '')).filter(Boolean))];
}
const configFrom = (data: FirebaseFirestore.DocumentData | undefined): EvaluationConfig => {
  const config = { ...initialEvaluation, ...data } as EvaluationConfig;
  return { ...config, finalRubric: ['setup', 'team'].includes(config.phase) ? officialCriteria : config.finalRubric?.length ? config.finalRubric : officialCriteria };
};
function randomOrder(): Team[] {
  const order = [...teams];
  for (let index = order.length - 1; index > 0; index--) {
    const chosen = randomInt(index + 1);
    [order[index], order[chosen]] = [order[chosen], order[index]];
  }
  return order;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user.admin) {
      const settings = await adminDb().collection('settings').doc('site').get();
      if (settings.data()?.evaluation !== true) return NextResponse.json({ error: 'Evaluation is not open to participants yet.' }, { status: 403 });
    }
    const [configSnapshot, members, ownerIds, sheetsSnapshot, representativeSnapshot] = await Promise.all([configRef().get(), participants(), outcomeOwners(), scoresRef().get(), representativesRef().get()]);
    const config = configFrom(configSnapshot.data());
    const finalRankings = rankings(teams.filter(team => config.finalists[team]), sheetsSnapshot.docs.map(doc => doc.data() as ScoreSheet), config.finalRubric);
    const individualScores = user.admin ? sheetsSnapshot.docs.map(sheet => {
      const record = sheet.data() as ScoreSheet & { teamId?: Team };
      const targets = teams.filter(team => team !== config.assignments[sheet.id]);
      return {
        uid: sheet.id,
        nickname: members.find(member => member.uid === sheet.id)?.nickname || 'Participant',
        teamId: config.assignments[sheet.id] || record.teamId || null,
        scores: Object.fromEntries(targets.map(team => [team, record.scores?.[team] ? Object.values(record.scores[team]).reduce((sum, point) => sum + Number(point || 0), 0) : null])),
      };
    }) : [];
    return NextResponse.json({
      config: user.admin || config.finalResultsPublished ? config : { ...config, winnerTeamId: undefined },
      members,
      outcomeOwners: ownerIds.filter(uid => members.some(member => member.uid === uid)),
      representatives: Object.fromEntries(representativeSnapshot.docs.filter(doc => teams.includes(doc.id as Team)).map(doc => [doc.id, doc.data()])),
      myFinalSheet: sheetsSnapshot.docs.some(doc => doc.id === user.uid) ? { submitted: true } : null,
      finalRankings: user.admin ? finalRankings : [],
      finalSubmissionCount: user.admin ? sheetsSnapshot.size : undefined,
      individualScores,
    });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user.admin) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    const body = await request.json();
    const ref = configRef();
    const config = configFrom((await ref.get()).data());
    const members = await participants();
    const memberIds = new Set(members.map(member => member.uid));

    if (body.action === 'assign') {
      if (config.phase !== 'setup') throw new Error('Team assignments are locked after team sharing opens.');
      if (!body.assignments || typeof body.assignments !== 'object') throw new Error('Choose team assignments.');
      const assignments = Object.fromEntries(Object.entries(body.assignments).filter(([uid, team]) => memberIds.has(uid) && teams.includes(team as Team))) as Record<string, Team>;
      await ref.set({ assignments }, { merge: true });
    } else if (body.action === 'drawOrder') {
      if (config.phase !== 'team') throw new Error('Draw the order during team sharing, before final pitches open.');
      let presentationOrder = randomOrder();
      while (presentationOrder.join('') === (config.presentationOrder || teams).join('')) presentationOrder = randomOrder();
      await ref.set({ presentationOrder }, { merge: true });
    } else if (body.action === 'openTeam') {
      if (config.phase !== 'setup') throw new Error('Team sharing has already started.');
      const settings = await adminDb().collection('settings').doc('site').get();
      if (settings.data()?.share !== true) throw new Error('Open Final outcomes to participants before starting team sharing.');
      if (!members.length || members.some(member => !config.assignments[member.uid]) || teams.some(team => members.filter(member => config.assignments[member.uid] === team).length < 2)) throw new Error('Assign every participant and at least two people to each team first.');
      await ref.set({ phase: 'team', teamResultsPublished: false }, { merge: true });
    } else if (body.action === 'openFinal') {
      if (config.phase !== 'team') throw new Error('Open team sharing first.');
      if (!config.finalRubric.length) throw new Error('Set the final scoring rubric first.');
      const representativeSnapshot = await representativesRef().get();
      const representativeDocs = new Map(representativeSnapshot.docs.map(doc => [doc.id, doc.data()]));
      const finalists = {} as Record<Team, string>;
      for (const team of teams) {
        const entry = representativeDocs.get(team);
        const uid = String(entry?.ownerUid || '');
        if (!uid || !memberIds.has(uid) || config.assignments[uid] !== team) throw new Error(`Team ${team} must submit its agreed representative first.`);
        const outcome = await adminDb().collection('projects').doc(String(entry?.outcomeId || '')).get();
        if (!outcome.exists || outcome.data()?.ownerId !== uid || outcome.data()?.isPublic !== true || outcome.data()?.stage !== 'share') throw new Error(`Team ${team}'s representative outcome is unavailable.`);
        finalists[team] = uid;
      }
      await ref.set({ phase: 'final', finalists, presentationOrder: config.presentationOrder?.length === teams.length ? config.presentationOrder : randomOrder(), finalRubric: config.finalRubric, finalDeadline: validDeadline(body.deadline), finalResultsPublished: false }, { merge: true });
    } else if (body.action === 'closeFinal') {
      if (config.phase !== 'final') throw new Error('Open final scoring first.');
      if (!config.finalDeadline || Date.now() < Date.parse(config.finalDeadline)) throw new Error('Wait until the final scoring deadline before confirming the winner.');
      const winner = body.winnerTeamId as Team;
      const sheets = (await scoresRef().get()).docs.map(doc => doc.data() as ScoreSheet);
      const ranking = rankings(teams.filter(team => config.finalists[team]), sheets, config.finalRubric);
      if (!teams.includes(winner) || !ranking[0]?.reviews || !ranking.some(item => item.id === winner && item.average === ranking[0].average)) throw new Error('Choose a top-scoring team. The administrator can resolve ties.');
      await ref.set({ phase: 'closed', winnerTeamId: winner }, { merge: true });
    } else if (body.action === 'publishResults') {
      const round = body.round as 'team' | 'final';
      if (round === 'team') {
        if (!['final', 'closed'].includes(config.phase) || teams.some(team => !config.finalists[team])) throw new Error('Confirm all team representatives first.');
        await ref.set({ teamResultsPublished: true }, { merge: true });
      } else if (round === 'final') {
        if (config.phase !== 'closed' || !config.winnerTeamId) throw new Error('Confirm the winning team first.');
        await ref.set({ finalResultsPublished: true }, { merge: true });
      } else throw new Error('Choose a result to publish.');
    } else throw new Error('Unknown evaluation action.');

    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
