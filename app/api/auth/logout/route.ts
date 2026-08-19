import { NextRequest } from 'next/server';
import { apiJson } from '@/infra/http/apiJson';
import { createCookieSupabase } from '@/infra/supabase/cookieClient';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

export async function POST(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { status: 'ok' });
  }
  const supabase = await createCookieSupabase();
  await supabase.auth.signOut();
  return apiJson(request, { status: 'ok' });
}
