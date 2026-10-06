import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

export async function requireAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  const decoded = await adminAuth().verifyIdToken(token);
  if (!decoded.admin) throw new Error('Administrator access required');
  return decoded;
}
