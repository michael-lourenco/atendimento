import { NextResponse } from 'next/server';
import { createCookieSupabase } from '@/infra/supabase/cookieClient';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

export async function POST() {
  if (!isPublicSupabaseConfigured()) {
    return NextResponse.json({ status: 'ok' });
  }
  const supabase = await createCookieSupabase();
  await supabase.auth.signOut();
  return NextResponse.json({ status: 'ok' });
}
