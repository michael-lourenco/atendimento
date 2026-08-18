import { NextResponse } from 'next/server';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';

export async function GET() {
  if (!isPublicSupabaseConfigured()) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const user = await getOperatorUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  return NextResponse.json(user);
}
