import { NextRequest } from 'next/server';
import { CreateOperatorError } from '@/core/usecases/CreateOperatorUseCase';
import { DeleteOperatorUseCase } from '@/core/usecases/DeleteOperatorUseCase';
import { SetOperatorPasswordUseCase } from '@/core/usecases/SetOperatorPasswordUseCase';
import { SetOperatorRoleUseCase } from '@/core/usecases/SetOperatorRoleUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { operatorUseCaseResponse } from '@/infra/http/operatorUseCaseResponse';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { setOperatorRoleBodySchema } from '@/infra/http/schemas';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { requireAdminUser } from '@/infra/supabase/requireAdmin';
import { isServiceRoleConfigured } from '@/infra/supabase/serviceRoleClient';

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
    const body = await parseJsonBody(request, setOperatorRoleBodySchema);
    const auth = serverLocator.getRepos().auth;
    if (body.role) {
      await new SetOperatorRoleUseCase(auth).execute(gate.user, id, body.role);
    }
    if (body.password) {
      if (!isServiceRoleConfigured()) {
        return apiJson(request, { error: 'Supabase não configurado' }, { status: 503 });
      }
      await new SetOperatorPasswordUseCase(auth).execute(gate.user, id, body.password);
    }
    return apiJson(request, { ok: true });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    if (error instanceof CreateOperatorError) {
      return apiJson(request, { error: error.message }, { status: error.status });
    }
    return operatorUseCaseResponse(request, error, 'Erro ao alterar operador');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isPublicSupabaseConfigured() || !isServiceRoleConfigured()) {
    return apiJson(request, { error: 'Supabase não configurado' }, { status: 503 });
  }
  const gate = await requireAdminUser(request);
  if ('response' in gate) {
    return gate.response;
  }
  try {
    const { id } = await context.params;
    const repos = serverLocator.getRepos();
    await new DeleteOperatorUseCase(repos.auth, repos.agent).execute(gate.user, id);
    return apiJson(request, { ok: true });
  } catch (error) {
    if (error instanceof CreateOperatorError) {
      return apiJson(request, { error: error.message }, { status: error.status });
    }
    return operatorUseCaseResponse(request, error, 'Erro ao excluir operador');
  }
}
