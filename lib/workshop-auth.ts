import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function requireUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!token) throw new Error('Sign in is required.');
  return adminAuth().verifyIdToken(token);
}

export function errorResponse(error: unknown, fallback = 'Request failed.') {
  const message = error instanceof Error ? error.message : fallback;
  const status = /sign in|required|unauthorized/i.test(message) ? 401 : 400;
  return Response.json({ error: message }, { status });
}
