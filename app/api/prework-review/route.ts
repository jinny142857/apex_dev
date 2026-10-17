import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Sign in to view your feedback.' }, { status: 401 });

  try {
    const account = await adminAuth().verifyIdToken(token);
    const snapshot = await adminDb().collection('preworkReviews').doc(account.uid).get();
    if (!snapshot.exists) return NextResponse.json({ review: null }, { headers: { 'Cache-Control': 'private, no-store' } });

    const { status, feedback, suggestedProblem, caution, ideas } = snapshot.data() || {};
    return NextResponse.json({ review: { status, feedback, suggestedProblem, caution, ideas } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not load your feedback.' }, { status: 401 });
  }
}
