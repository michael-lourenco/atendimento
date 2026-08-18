import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { WhatsAppWebhookEntry } from '@/core/services/IWhatsAppService';

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

  const whatsAppService = serverLocator.getWhatsAppService();
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

    if (!body.object || body.object !== 'whatsapp_business_account') {
      return NextResponse.json(
        { error: 'Objeto inválido' },
        { status: 400 }
      );
    }

    if (body.entry && Array.isArray(body.entry)) {
      const useCase = serverLocator.createIncomingHandler();
      for (const entry of body.entry as WhatsAppWebhookEntry[]) {
        await useCase.execute(entry);
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar webhook do WhatsApp:', error);

    return NextResponse.json(
      { error: 'Erro interno', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    );
  }
}
