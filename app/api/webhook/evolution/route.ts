import { NextRequest } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { EvolutionWhatsAppService } from '@/infra/whatsapp/EvolutionWhatsAppService';
import { hydrateEvolutionMedia } from '@/infra/whatsapp/evolutionMedia';
import { mapEvolutionReactions } from '@/infra/whatsapp/mapEvolutionIncoming';
import { isEvolutionInboxEvent, mapEvolutionStatusUpdates } from '@/infra/whatsapp/mapEvolutionStatus';
import { isEvolutionPresenceEvent, mapEvolutionPresence } from '@/infra/whatsapp/mapEvolutionPresence';
import { ApplyMessageReactionUseCase } from '@/core/usecases/ApplyMessageReactionUseCase';
import { ApplyContactTypingUseCase } from '@/core/usecases/ApplyContactTypingUseCase';
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
    const instanceName =
      (typeof instance === 'string' && instance.trim()) ||
      (typeof body.instance === 'string' && body.instance.trim()) ||
      undefined;
    const whatsAppService = serverLocator.getWhatsAppService();

    if (isEvolutionPresenceEvent(event) && whatsAppService instanceof EvolutionWhatsAppService) {
      const repos = serverLocator.getRepos();
      const lineName = instanceName || process.env.EVOLUTION_INSTANCE_NAME || 'default';
      const applyTyping = new ApplyContactTypingUseCase(repos.conversation, repos.whatsAppNumber);
      for (const presence of mapEvolutionPresence({ event, data })) {
        await applyTyping.execute({
          phone: presence.phone,
          instanceName: lineName,
          composing: presence.composing,
        });
      }
      return apiJson(request, { status: 'ok' }, { status: 200 });
    }

    if (!isEvolutionInboxEvent(event)) {
      return apiJson(request, { status: 'ok' }, { status: 200 });
    }

    if (whatsAppService instanceof EvolutionWhatsAppService) {
      const repos = serverLocator.getRepos();
      const lineName = instanceName || process.env.EVOLUTION_INSTANCE_NAME || 'default';
      const updates = mapEvolutionStatusUpdates({ event, data });
      if (updates.length > 0) {
        const updateStatus = new UpdateMessageStatusUseCase(repos.message, repos.conversation);
        for (const update of updates) {
          await updateStatus.execute(update.id, update.status);
        }
      }

      const applyReaction = new ApplyMessageReactionUseCase(repos.message);
      for (const reaction of mapEvolutionReactions({ event, data }, lineName)) {
        await applyReaction.execute(reaction);
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
        const { fresh, hints } = await handleIncoming.persistIncoming(messages);
        void handleIncoming.runIncomingFlow(fresh, hints).catch((error) => {
          logApiError(requestIdFrom(request), 'Erro no motor do webhook Evolution', error);
        });
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
