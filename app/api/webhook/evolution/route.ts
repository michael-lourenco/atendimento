import { NextRequest, NextResponse } from 'next/server';
import { serviceLocator } from '@/infra/adapters/ServiceLocator';
import { EvolutionWhatsAppService } from '@/infra/whatsapp/EvolutionWhatsAppService';
import { HandleIncomingWhatsAppMessageUseCase } from '@/core/usecases/HandleIncomingWhatsAppMessageUseCase';

/**
 * Webhook do Evolution API para receber mensagens
 * 
 * Evolution API envia webhooks em formato diferente da Meta Cloud API.
 * Este endpoint processa especificamente o formato do Evolution.
 * 
 * Formato do webhook Evolution:
 * {
 *   "event": "messages.upsert",
 *   "instance": "instance-name",
 *   "data": {
 *     "key": { "id": "...", "remoteJid": "..." },
 *     "message": { ... },
 *     "messageTimestamp": 1234567890
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar se é um evento de mensagem
    if (!body.event || !body.data) {
      return NextResponse.json(
        { error: 'Formato de webhook inválido' },
        { status: 400 }
      );
    }

    const whatsAppService = serviceLocator.getWhatsAppService();
    
    // Se for Evolution API, processar formato específico
    if (whatsAppService instanceof EvolutionWhatsAppService) {
      // Processar webhook no formato Evolution
      const messages = await whatsAppService.processEvolutionWebhook(body);
      
      if (messages.length > 0) {
        // Salvar mensagens no repositório
        const messageRepository = serviceLocator.getMessageRepository();
        for (const message of messages) {
          await messageRepository.save(message);
        }

        // TODO: Aqui você pode adicionar lógica de fluxos
        // Por exemplo, processar a mensagem e determinar qual resposta enviar
        // baseado nos fluxos configurados
      }
      
      // Evolution API espera resposta 200 para confirmar recebimento
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    
    // Se não for Evolution API, retornar erro
    return NextResponse.json(
      { error: 'Este endpoint é específico para Evolution API' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao processar webhook do Evolution:', error);
    
    // Ainda retornamos 200 para não causar retry desnecessário
    // Mas logamos o erro para debug
    return NextResponse.json(
      { 
        error: 'Erro interno', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 200 }
    );
  }
}

