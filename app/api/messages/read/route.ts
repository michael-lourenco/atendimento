import { NextRequest } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { MarkWhatsAppMessagesReadUseCase } from '@/core/usecases/MarkWhatsAppMessagesReadUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { readMessagesBodySchema } from '@/infra/http/schemas';
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

    const body = await parseJsonBody(request, readMessagesBodySchema);
    const repos = serverLocator.getRepos();
    const result = await new MarkWhatsAppMessagesReadUseCase(
      serverLocator.getWhatsAppService(),
      repos.conversation,
      repos.message,
      repos.whatsAppNumber
    ).execute(body.conversationId);
    if (!result) {
      return apiJson(request, { error: 'Conversa não encontrada' }, { status: 404 });
    }
    return apiJson(request, result, { status: 200 });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao marcar mensagens como lidas', error);
    return apiJson(request, { error: 'Erro ao marcar mensagens como lidas' }, { status: 500 });
  }
}
