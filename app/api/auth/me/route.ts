import { NextRequest } from 'next/server';
import { LoginDeniedError } from '@/core/entities/loginDenied';
import { EnsureOperatorAgentUseCase } from '@/core/usecases/EnsureOperatorAgentUseCase';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { operatorUseCaseResponse } from '@/infra/http/operatorUseCaseResponse';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

export async function GET(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { error: 'unauthenticated' }, { status: 401 });
  }
  try {
    const repos = serverLocator.getRepos();
    const user = await new GetCurrentUserUseCase(
      repos.auth,
      new EnsureOperatorAgentUseCase(repos.agent),
      repos.agent
    ).execute();
    if (!user) {
      return apiJson(request, { error: 'unauthenticated' }, { status: 401 });
    }
    return apiJson(request, user);
  } catch (error) {
    if (error instanceof LoginDeniedError) {
      return apiJson(request, { error: error.message }, { status: 403 });
    }
    return operatorUseCaseResponse(request, error, 'Erro ao ler sessão');
  }
}
