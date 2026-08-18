import { NextRequest, NextResponse } from 'next/server';
import { createCookieSupabase } from '@/infra/supabase/cookieClient';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

export async function POST(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 });
  }

  const body = await request.json();
  const email = String(body.email ?? '');
  const password = String(body.password ?? '');
  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
  }

  const supabase = await createCookieSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  return NextResponse.json({
    id: data.user.id,
    email: profile?.email ?? data.user.email,
    name: profile?.name ?? '',
    role: profile?.role === 'admin' ? 'admin' : 'user',
    createdAt: profile?.created_at ?? new Date().toISOString(),
  });
}
