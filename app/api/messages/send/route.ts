import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { SendWhatsAppMessageUseCase } from '@/core/usecases/SendWhatsAppMessageUseCase';
import { UpsertConversationFromMessageUseCase } from '@/core/usecases/UpsertConversationFromMessageUseCase';
import { UpsertContactFromIncomingUseCase } from '@/core/usecases/UpsertContactFromIncomingUseCase';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';

export async function POST(request: NextRequest) {
  try {
    if (isPublicSupabaseConfigured()) {
      const operator = await getOperatorUser();
      if (!operator) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { to, message, type, templateName, templateParams } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: to, message' },
        { status: 400 }
      );
    }

    if (type === 'template' && !templateName) {
      return NextResponse.json(
        { error: 'templateName é obrigatório quando type é "template"' },
        { status: 400 }
      );
    }

    const locator = serverLocator;
    const repos = locator.getRepos();
    const upsert = new UpsertConversationFromMessageUseCase(repos.conversation, repos.contact);
    const upsertContact = new UpsertContactFromIncomingUseCase(repos.contact);
    const useCase = new SendWhatsAppMessageUseCase(
      locator.getWhatsAppService(),
      repos.message,
      upsert,
      upsertContact
    );
    const result = await useCase.execute({
      to,
      message,
      type,
      templateName,
      templateParams,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
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
