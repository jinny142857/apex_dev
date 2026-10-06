import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await adminAuth().verifyIdToken(token);
    await adminDb().collection('users').doc(user.uid).set({ preworkGuideSeenAt: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not save guide preference.' }, { status: 401 });
  }
}
