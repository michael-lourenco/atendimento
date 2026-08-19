import { NextRequest } from 'next/server';
import { apiJson } from '@/infra/http/apiJson';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { loginBodySchema } from '@/infra/http/schemas';
import { createCookieSupabase } from '@/infra/supabase/cookieClient';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

export async function POST(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { error: 'Supabase não configurado' }, { status: 503 });
  }

  try {
    const { email, password } = await parseJsonBody(request, loginBodySchema);
    const supabase = await createCookieSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return apiJson(request, { error: 'Credenciais inválidas' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return apiJson(request, {
      id: data.user.id,
      email: profile?.email ?? data.user.email,
      name: profile?.name ?? '',
      role: profile?.role === 'admin' ? 'admin' : 'user',
      createdAt: profile?.created_at ?? new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    return apiJson(request, { error: 'Erro ao entrar' }, { status: 500 });
  }
}
