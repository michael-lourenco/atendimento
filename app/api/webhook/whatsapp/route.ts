import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { apiJson, applyRequestId } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { metaWebhookSchema } from '@/infra/http/schemas';
import { WhatsAppWebhookEntry } from '@/core/services/IWhatsAppService';
import { ApplyMessageReactionUseCase } from '@/core/usecases/ApplyMessageReactionUseCase';
import { mapMetaReactions } from '@/infra/whatsapp/mapMetaReactions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (!mode || !token || !challenge) {
    return apiJson(request, { error: 'Parâmetros de verificação inválidos' }, { status: 400 });
  }

  const whatsAppService = serverLocator.getWhatsAppService();
  const verifiedChallenge = whatsAppService.verifyWebhook(mode, token, challenge);

  if (verifiedChallenge) {
    return applyRequestId(request, new NextResponse(verifiedChallenge, { status: 200 }));
  }

  return apiJson(request, { error: 'Token de verificação inválido' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, metaWebhookSchema);
    if (body.entry && Array.isArray(body.entry)) {
      const whatsAppService = serverLocator.getWhatsAppService();
      const useCase = serverLocator.createIncomingHandler();
      const applyReaction = new ApplyMessageReactionUseCase(serverLocator.getRepos().message);
      for (const entry of body.entry as WhatsAppWebhookEntry[]) {
        const messages = await whatsAppService.processWebhook(entry);
        const { fresh, hints } = await useCase.persistIncoming(messages);
        void useCase.runIncomingFlow(fresh, hints).catch((error) => {
          logApiError(requestIdFrom(request), 'Erro no motor do webhook WhatsApp', error);
        });
        for (const reaction of mapMetaReactions(entry)) {
          await applyReaction.execute(reaction);
        }
      }
    }
    return apiJson(request, { status: 'ok' }, { status: 200 });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao processar webhook do WhatsApp', error);
    return apiJson(request, { status: 'ok' }, { status: 200 });
  }
}
