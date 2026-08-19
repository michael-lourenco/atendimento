import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { SendWhatsAppMessageUseCase } from '@/core/usecases/SendWhatsAppMessageUseCase';
import { UpsertConversationFromMessageUseCase } from '@/core/usecases/UpsertConversationFromMessageUseCase';
import { UpsertContactFromIncomingUseCase } from '@/core/usecases/UpsertContactFromIncomingUseCase';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';
import { PauseContactFlowUseCase } from '@/core/usecases/PauseContactFlowUseCase';
import { parseSendRequest, SendRequestError } from './parseSendRequest';

export async function POST(request: NextRequest) {
  try {
    if (isPublicSupabaseConfigured()) {
      const operator = await getOperatorUser();
      if (!operator) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
    }

    const input = await parseSendRequest(request);
    const locator = serverLocator;
    const repos = locator.getRepos();
    const upsert = new UpsertConversationFromMessageUseCase(repos.conversation, repos.contact);
    const upsertContact = new UpsertContactFromIncomingUseCase(repos.contact);
    const useCase = new SendWhatsAppMessageUseCase(
      locator.getWhatsAppService(),
      repos.message,
      upsert,
      upsertContact,
      locator.getMediaStorage()
    );
    const result = await useCase.execute(input);

    try {
      await new PauseContactFlowUseCase(repos.flowSession, repos.flow).execute(input.to);
    } catch (pauseError) {
      console.error('Falha ao pausar fluxo após envio do operador:', pauseError);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof SendRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Erro ao enviar mensagem:', error);

    return NextResponse.json(
      {
        error: 'Erro ao enviar mensagem',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
