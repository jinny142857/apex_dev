import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Enter your real name, email, and a password of at least 8 characters.' }, { status: 400 });
    }
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = body.password;

    if (!nickname || !email || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Enter your real name, email, and a password of at least 8 characters.' }, { status: 400 });
    }

    const existing = await adminDb().collection('users').where('nickname', '==', nickname).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ error: 'That nickname is already in use.' }, { status: 409 });
    }

    const user = await adminAuth().createUser({ email, password, displayName: nickname });
    try {
      await adminDb().collection('users').doc(user.uid).set({ nickname, email, role: 'participant', createdAt: new Date().toISOString() });
    } catch (error) {
      await adminAuth().deleteUser(user.uid);
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });
      }
      if (error.code === 'auth/invalid-email') {
        return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 });
  }
}
