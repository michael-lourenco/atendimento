import { NextRequest } from 'next/server';
import { LoginDeniedError } from '@/core/entities/loginDenied';
import { LoginUseCase } from '@/core/usecases/LoginUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { operatorUseCaseResponse } from '@/infra/http/operatorUseCaseResponse';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { loginBodySchema } from '@/infra/http/schemas';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

export async function POST(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { error: 'Supabase não configurado' }, { status: 503 });
  }

  try {
    const { email, password } = await parseJsonBody(request, loginBodySchema);
    const repos = serverLocator.getRepos();
    const user = await new LoginUseCase(repos.auth, repos.agent).execute(email, password);
    if (!user) {
      return apiJson(request, { error: 'Credenciais inválidas' }, { status: 401 });
    }
    return apiJson(request, user);
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    if (error instanceof LoginDeniedError) {
      return apiJson(request, { error: error.message }, { status: 403 });
    }
    return operatorUseCaseResponse(request, error, 'Erro ao entrar');
  }
}
