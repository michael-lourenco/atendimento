import { NextRequest, NextResponse } from 'next/server';
import { serviceLocator } from '@/infra/adapters/ServiceLocator';
import { HandleIncomingWhatsAppMessageUseCase } from '@/core/usecases/HandleIncomingWhatsAppMessageUseCase';
import { WhatsAppWebhookEntry } from '@/core/services/IWhatsAppService';

/**
 * Webhook do WhatsApp para receber mensagens
 * 
 * GET: Verificação do webhook (requisito da Meta)
 * POST: Recebimento de mensagens e eventos
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (!mode || !token || !challenge) {
    return NextResponse.json(
      { error: 'Parâmetros de verificação inválidos' },
      { status: 400 }
    );
  }

  const whatsAppService = serviceLocator.getWhatsAppService();
  const verifiedChallenge = whatsAppService.verifyWebhook(mode, token, challenge);

  if (verifiedChallenge) {
    return new NextResponse(verifiedChallenge, { status: 200 });
  }

  return NextResponse.json(
    { error: 'Token de verificação inválido' },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar se é uma notificação do WhatsApp
    if (!body.object || body.object !== 'whatsapp_business_account') {
      return NextResponse.json(
        { error: 'Objeto inválido' },
        { status: 400 }
      );
    }

    // Processar cada entrada
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry as WhatsAppWebhookEntry[]) {
        const useCase = new HandleIncomingWhatsAppMessageUseCase();
        await useCase.execute(entry);
      }
    }

    // WhatsApp espera resposta 200 para confirmar recebimento
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar webhook do WhatsApp:', error);
    
    // Ainda retornamos 200 para não causar retry desnecessário
    // Mas logamos o erro para debug
    return NextResponse.json(
      { error: 'Erro interno', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    );
  }
}

