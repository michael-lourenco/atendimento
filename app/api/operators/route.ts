import { NextRequest } from 'next/server';
import { User } from '@/core/entities/User';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { createOperatorBodySchema } from '@/infra/http/schemas';
import { asDate } from '@/infra/supabase/crud';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { requireAdminUser } from '@/infra/supabase/requireAdmin';
import { createCookieSupabase } from '@/infra/supabase/cookieClient';
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from '@/infra/supabase/serviceRoleClient';

function profileToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    name: String(row.name ?? ''),
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: asDate(row.created_at),
  };
}

export async function GET(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { error: 'Supabase não configurado' }, { status: 503 });
  }
  const gate = await requireAdminUser(request);
  if ('response' in gate) {
    return gate.response;
  }
  const supabase = await createCookieSupabase();
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error) {
    logApiError(requestIdFrom(request), 'Erro ao listar operadores', error);
    return apiJson(request, { error: 'Erro ao listar operadores' }, { status: 500 });
  }
  return apiJson(request, (data ?? []).map((row) => profileToUser(row as Record<string, unknown>)));
}

export async function POST(request: NextRequest) {
  if (!isPublicSupabaseConfigured() || !isServiceRoleConfigured()) {
    return apiJson(request, { error: 'Supabase não configurado' }, { status: 503 });
  }
  const gate = await requireAdminUser(request);
  if ('response' in gate) {
    return gate.response;
  }
  try {
    const body = await parseJsonBody(request, createOperatorBodySchema);
    const email = body.email.trim().toLowerCase();
    const name = body.name.trim();
    const role = body.role === 'admin' ? 'admin' : 'user';
    const departmentId = body.departmentId?.trim() ?? '';
    const adminClient = createServiceRoleClient();
    const [{ data: profileRows }, { data: agentRows }] = await Promise.all([
      adminClient.from('profiles').select('email'),
      adminClient.from('agents').select('email'),
    ]);
    const emailTaken = [...(profileRows ?? []), ...(agentRows ?? [])].some(
      (row) => String((row as { email?: string }).email ?? '').trim().toLowerCase() === email
    );
    if (emailTaken) {
      return apiJson(request, { error: 'E-mail já cadastrado' }, { status: 409 });
    }
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !data.user) {
      const conflict = error?.message?.toLowerCase().includes('already') ?? false;
      if (!conflict) {
        logApiError(requestIdFrom(request), 'Erro ao criar operador', error);
      }
      return apiJson(
        request,
        { error: conflict ? 'E-mail já cadastrado' : 'Não foi possível criar' },
        { status: conflict ? 409 : 500 }
      );
    }
    if (role === 'admin') {
      await adminClient.from('profiles').update({ role: 'admin', name }).eq('id', data.user.id);
    } else {
      await adminClient.from('profiles').update({ name }).eq('id', data.user.id);
    }
    if (departmentId) {
      await adminClient.from('agents').update({ department_id: departmentId }).eq('id', data.user.id);
    }
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    return apiJson(
      request,
      profileToUser((profile ?? { id: data.user.id, email, name, role }) as Record<string, unknown>),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao criar operador', error);
    return apiJson(request, { error: 'Não foi possível criar' }, { status: 500 });
  }
}
