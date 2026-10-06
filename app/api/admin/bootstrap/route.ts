import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
export async function POST(request: NextRequest) {
  if (request.headers.get('x-setup-secret') !== process.env.ADMIN_SETUP_SECRET) return NextResponse.json({ error: 'Invalid setup secret' }, { status: 401 });
  const email = process.env.ADMIN_EMAIL!, password = process.env.ADMIN_PASSWORD!, nickname = process.env.ADMIN_NICKNAME!;
  if (!email || !password || !nickname) return NextResponse.json({ error: 'Missing administrator environment variables' }, { status: 500 });
  let user; try { user = await adminAuth().getUserByEmail(email); } catch { user = await adminAuth().createUser({ email, password, displayName: nickname }); }
  await adminAuth().setCustomUserClaims(user.uid, { admin: true });
  await adminDb().collection('users').doc(user.uid).set({ nickname, email, role: 'admin', createdAt: new Date().toISOString() }, { merge: true });
  await adminDb().collection('settings').doc('site').set({ prework: true, prd: false, share: false }, { merge: true });
  return NextResponse.json({ ok: true, message: 'Administrator is ready.' });
}
