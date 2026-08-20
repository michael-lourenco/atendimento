import { NextRequest } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { SendMessageReactionUseCase } from '@/core/usecases/SendMessageReactionUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { reactMessageBodySchema } from '@/infra/http/schemas';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';

export async function POST(request: NextRequest) {
  try {
    if (isPublicSupabaseConfigured()) {
      const operator = await getOperatorUser();
      if (!operator) {
        return apiJson(request, { error: 'Não autenticado' }, { status: 401 });
      }
    }

    const body = await parseJsonBody(request, reactMessageBodySchema);
    const repos = serverLocator.getRepos();
    const updated = await new SendMessageReactionUseCase(
      serverLocator.getWhatsAppService(),
      repos.message
    ).execute(body);
    if (!updated) {
      return apiJson(request, { error: 'Mensagem não encontrada' }, { status: 404 });
    }
    return apiJson(request, updated, { status: 200 });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao enviar reação', error);
    return apiJson(request, { error: 'Erro ao enviar reação' }, { status: 500 });
  }
}
