import { NextRequest } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { EvolutionWhatsAppService } from '@/infra/whatsapp/EvolutionWhatsAppService';
import { hydrateEvolutionMedia } from '@/infra/whatsapp/evolutionMedia';
import { isEvolutionInboxEvent, mapEvolutionStatusUpdates } from '@/infra/whatsapp/mapEvolutionStatus';
import { UpdateMessageStatusUseCase } from '@/core/usecases/UpdateMessageStatusUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { evolutionWebhookData, evolutionWebhookSchema } from '@/infra/http/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, evolutionWebhookSchema);
    const { event, data, instance } = evolutionWebhookData(body);
    if (!isEvolutionInboxEvent(event)) {
      return apiJson(request, { status: 'ok' }, { status: 200 });
    }
    const instanceName =
      (typeof instance === 'string' && instance.trim()) ||
      (typeof body.instance === 'string' && body.instance.trim()) ||
      undefined;

    const whatsAppService = serverLocator.getWhatsAppService();

    if (whatsAppService instanceof EvolutionWhatsAppService) {
      const updates = mapEvolutionStatusUpdates({ event, data });
      if (updates.length > 0) {
        const updateStatus = new UpdateMessageStatusUseCase(serverLocator.getRepos().message);
        for (const update of updates) {
          await updateStatus.execute(update.id, update.status);
        }
      }

      const messages = await whatsAppService.processEvolutionWebhook({
        ...body,
        event,
        data,
        instance: instanceName,
      });

      if (messages.length > 0) {
        await hydrateEvolutionMedia({
          payload: { event, data },
          messages,
          download: (input) => whatsAppService.downloadMedia({ ...input, instanceName }),
          storage: serverLocator.getMediaStorage(),
        });
        const handleIncoming = serverLocator.createIncomingHandler();
        await handleIncoming.executeMessages(messages);
      }

      return apiJson(request, { status: 'ok' }, { status: 200 });
    }

    return apiJson(request, { error: 'Este endpoint é específico para Evolution API' }, { status: 400 });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao processar webhook do Evolution', error);
    return apiJson(request, { status: 'ok' }, { status: 200 });
  }
}
