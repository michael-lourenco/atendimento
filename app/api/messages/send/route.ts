import { NextRequest } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { SendWhatsAppMessageUseCase } from '@/core/usecases/SendWhatsAppMessageUseCase';
import { UpsertConversationFromMessageUseCase } from '@/core/usecases/UpsertConversationFromMessageUseCase';
import { UpsertContactFromIncomingUseCase } from '@/core/usecases/UpsertContactFromIncomingUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';
import { PauseContactFlowUseCase } from '@/core/usecases/PauseContactFlowUseCase';
import { parseSendRequest, SendRequestError } from './parseSendRequest';

export async function POST(request: NextRequest) {
  try {
    if (isPublicSupabaseConfigured()) {
      const operator = await getOperatorUser();
      if (!operator) {
        return apiJson(request, { error: 'Não autenticado' }, { status: 401 });
      }
    }

    const input = await parseSendRequest(request);
    const locator = serverLocator;
    const repos = locator.getRepos();
    const upsert = new UpsertConversationFromMessageUseCase(
      repos.conversation,
      repos.contact,
      repos.whatsAppNumber
    );
    const upsertContact = new UpsertContactFromIncomingUseCase(repos.contact);
    const useCase = new SendWhatsAppMessageUseCase(
      locator.getWhatsAppService(),
      repos.message,
      upsert,
      upsertContact,
      locator.getMediaStorage(),
      repos.conversation,
      repos.whatsAppNumber
    );
    const result = await useCase.execute(input);

    try {
      await new PauseContactFlowUseCase(repos.flowSession, repos.flow).execute(
        input.conversationId?.trim() || input.to
      );
    } catch (pauseError) {
      logApiError(requestIdFrom(request), 'Falha ao pausar fluxo após envio do operador', pauseError);
    }

    return apiJson(request, result, { status: 200 });
  } catch (error) {
    if (error instanceof SendRequestError) {
      return apiJson(request, { error: error.message }, { status: error.status });
    }
    logApiError(requestIdFrom(request), 'Erro ao enviar mensagem', error);
    return apiJson(request, { error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}
