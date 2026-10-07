import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
export async function POST(request: NextRequest) {
  if (request.headers.get('x-setup-secret') !== process.env.ADMIN_SETUP_SECRET) return NextResponse.json({ error: 'Invalid setup secret' }, { status: 401 });
  const email = process.env.ADMIN_EMAIL!, password = process.env.ADMIN_PASSWORD!, nickname = process.env.ADMIN_NICKNAME!;
  if (!email || !password || !nickname) return NextResponse.json({ error: 'Missing administrator environment variables' }, { status: 500 });
  let user;
  try {
    user = await adminAuth().getUserByEmail(email);
    // Keep the configured administrator credentials in sync on repeat setup.
    user = await adminAuth().updateUser(user.uid, { password, displayName: nickname });
  } catch (error: any) {
    if (error.code !== 'auth/user-not-found') throw error;
    user = await adminAuth().createUser({ email, password, displayName: nickname });
  }
  await adminAuth().setCustomUserClaims(user.uid, { admin: true });
  await adminDb().collection('users').doc(user.uid).set({ nickname, email, role: 'admin', createdAt: new Date().toISOString() }, { merge: true });
  const siteSettings = adminDb().collection('settings').doc('site');
  if (!(await siteSettings.get()).exists) await siteSettings.set({ prework: true, practice: false, prd: false, share: false, evaluation: false });
  const surveys = adminDb().collection('apexDevSurveys');
  const existingAiSurvey = await surveys.where('templateKey', '==', 'ai-access-v1').limit(1).get();
  if (existingAiSurvey.empty) {
    await surveys.add({
      title: 'AI tools & subscriptions', templateKey: 'ai-access-v1', closesAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), closed: false, createdAt: new Date().toISOString(), createdBy: user.uid,
      questions: [
        { id: 'q1', prompt: 'Which AI tools do you currently use?', type: 'text', options: [] },
        { id: 'q2', prompt: 'Do you have access to a paid AI account?', type: 'single', options: ['I pay for one or more plans', 'My school provides access', 'I use free plans only', 'I am not sure'] },
        { id: 'q3', prompt: 'If yes, which paid tools or plans?', type: 'text', options: [] },
        { id: 'q4', prompt: 'What would you like to try with AI during the workshop?', type: 'text', options: [] },
      ],
    });
  }
  const examplePost = adminDb().collection('prework').doc('example-admin');
  if (!(await examplePost.get()).exists) {
    const contentResponse = await fetch(new URL('/content/problem-statement-assignment.md', request.url));
    if (!contentResponse.ok) throw new Error('Could not load the Pre-work Markdown file.');
    const source = await contentResponse.text();
    const example = source.match(/## Example\s*\n\s*>\s*\*\*([^\n]+?)\*\*/)?.[1];
    if (!example) throw new Error('The Pre-work Markdown file has no example statement.');
    await examplePost.set({ ownerId: user.uid, ownerName: nickname, text: example, isPublic: true, isExample: true, createdAt: new Date(), updatedAt: new Date() });
  }
  return NextResponse.json({ ok: true, message: 'Administrator is ready.' });
}
