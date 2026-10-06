import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const invalidCredentials = () => NextResponse.json({ error: 'Invalid nickname or password.' }, { status: 401 });

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();
    if (typeof nickname !== 'string' || typeof password !== 'string' || !nickname.trim() || !password) return invalidCredentials();

    const matches = await adminDb().collection('users').where('nickname', '==', nickname.trim()).limit(1).get();
    if (matches.empty) return invalidCredentials();

    const profile = matches.docs[0].data();
    if (typeof profile.email !== 'string') return invalidCredentials();
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.email, password, returnSecureToken: true }),
      cache: 'no-store',
    });
    if (!response.ok) return invalidCredentials();
    const signedIn = await response.json();
    if (signedIn.localId !== matches.docs[0].id) return invalidCredentials();

    const token = await adminAuth().createCustomToken(signedIn.localId);
    return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return invalidCredentials();
  }
}
