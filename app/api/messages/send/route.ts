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
import { ReopenConversationUseCase } from '@/core/usecases/ReopenConversationUseCase';
import { ResumeContactFlowUseCase } from '@/core/usecases/ResumeContactFlowUseCase';
import { conversationFromInboxQuery } from '@/core/entities/conversationThread';
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
    const threadId = input.conversationId?.trim();
    const existing =
      (threadId ? await repos.conversation.getById(threadId) : null) ??
      conversationFromInboxQuery(await repos.conversation.getAll(), { contactPhone: input.to });
    const wasClosed = existing?.status === 'closed';

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
      if (wasClosed && existing) {
        await new ReopenConversationUseCase(repos.conversation).execute(existing.id);
        await new ResumeContactFlowUseCase(repos.flowSession).execute(existing.id);
      } else {
        await new PauseContactFlowUseCase(
          repos.flowSession,
          repos.flow,
          repos.chatbot,
          repos.whatsAppNumber,
          repos.conversation
        ).execute(threadId || input.to);
      }
    } catch (pauseError) {
      logApiError(requestIdFrom(request), 'Falha ao ajustar fluxo após envio do operador', pauseError);
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
