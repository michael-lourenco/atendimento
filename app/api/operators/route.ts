import { NextRequest } from 'next/server';
import { CreateOperatorError, CreateOperatorUseCase } from '@/core/usecases/CreateOperatorUseCase';
import { EnsureOperatorAgentUseCase } from '@/core/usecases/EnsureOperatorAgentUseCase';
import { ListOperatorsUseCase } from '@/core/usecases/ListOperatorsUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { operatorUseCaseResponse } from '@/infra/http/operatorUseCaseResponse';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { createOperatorBodySchema } from '@/infra/http/schemas';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { requireAdminUser } from '@/infra/supabase/requireAdmin';
import { isServiceRoleConfigured } from '@/infra/supabase/serviceRoleClient';

export async function GET(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { error: 'Supabase não configurado' }, { status: 503 });
  }
  const gate = await requireAdminUser(request);
  if ('response' in gate) {
    return gate.response;
  }
  try {
    const users = await new ListOperatorsUseCase(serverLocator.getRepos().auth).execute(gate.user);
    return apiJson(request, users);
  } catch (error) {
    return operatorUseCaseResponse(request, error, 'Erro ao listar operadores');
  }
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
    const repos = serverLocator.getRepos();
    const created = await new CreateOperatorUseCase(
      repos.auth,
      repos.agent,
      new EnsureOperatorAgentUseCase(repos.agent)
    ).execute(gate.user, {
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role === 'admin' ? 'admin' : 'user',
      departmentId: body.departmentId?.trim() || undefined,
    });
    return apiJson(request, created, { status: 201 });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    if (error instanceof CreateOperatorError) {
      return apiJson(request, { error: error.message }, { status: error.status });
    }
    return operatorUseCaseResponse(request, error, 'Não foi possível criar');
  }
}
