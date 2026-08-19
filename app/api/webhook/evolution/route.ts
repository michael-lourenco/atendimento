import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { EvolutionWhatsAppService } from '@/infra/whatsapp/EvolutionWhatsAppService';
import { hydrateEvolutionMedia } from '@/infra/whatsapp/evolutionMedia';
import { mapEvolutionStatusUpdates } from '@/infra/whatsapp/mapEvolutionStatus';
import { UpdateMessageStatusUseCase } from '@/core/usecases/UpdateMessageStatusUseCase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const event = body.event;
    const data = body.data ?? (body.key ? body : null);

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Formato de webhook inválido' },
        { status: 400 }
      );
    }

    const whatsAppService = serverLocator.getWhatsAppService();

    if (whatsAppService instanceof EvolutionWhatsAppService) {
      const updates = mapEvolutionStatusUpdates({ event, data });
      if (updates.length > 0) {
        const updateStatus = new UpdateMessageStatusUseCase(serverLocator.getRepos().message);
        for (const update of updates) {
          await updateStatus.execute(update.id, update.status);
        }
      }

      const messages = await whatsAppService.processEvolutionWebhook({ ...body, event, data });

      if (messages.length > 0) {
        await hydrateEvolutionMedia({
          payload: { event, data },
          messages,
          download: (input) => whatsAppService.downloadMedia(input),
          storage: serverLocator.getMediaStorage(),
        });
        const handleIncoming = serverLocator.createIncomingHandler();
        await handleIncoming.executeMessages(messages);
      }

      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Este endpoint é específico para Evolution API' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao processar webhook do Evolution:', error);

    return NextResponse.json(
      {
        error: 'Erro interno',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
