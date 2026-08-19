import { NextRequest } from 'next/server';
import { canChangeOperatorRole } from '@/core/entities/operatorRole';
import { User } from '@/core/entities/User';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { setOperatorRoleBodySchema } from '@/infra/http/schemas';
import { asDate } from '@/infra/supabase/crud';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { requireAdminUser } from '@/infra/supabase/requireAdmin';
import { createCookieSupabase } from '@/infra/supabase/cookieClient';

function profileToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    name: String(row.name ?? ''),
    role: row.role === 'admin' ? 'admin' : 'user',
    createdAt: asDate(row.created_at),
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { error: 'Supabase não configurado' }, { status: 503 });
  }
  const gate = await requireAdminUser(request);
  if ('response' in gate) {
    return gate.response;
  }
  try {
    const { id } = await context.params;
    const { role } = await parseJsonBody(request, setOperatorRoleBodySchema);
    const supabase = await createCookieSupabase();
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      logApiError(requestIdFrom(request), 'Erro ao listar operadores', error);
      return apiJson(request, { error: 'Erro ao alterar papel' }, { status: 500 });
    }
    const operators = (data ?? []).map((row) => profileToUser(row as Record<string, unknown>));
    if (!canChangeOperatorRole(gate.user, operators, id, role)) {
      return apiJson(request, { error: 'Não é possível rebaixar o último admin' }, { status: 400 });
    }
    const { error: updateError } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (updateError) {
      logApiError(requestIdFrom(request), 'Erro ao alterar papel', updateError);
      return apiJson(request, { error: 'Erro ao alterar papel' }, { status: 500 });
    }
    return apiJson(request, { ok: true });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao alterar papel', error);
    return apiJson(request, { error: 'Erro ao alterar papel' }, { status: 500 });
  }
}
