import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook para receber notificações do chat-whatsapp
 * 
 * Tipos de eventos:
 * - status: Mudança de status (connected/disconnected)
 * - qr: QR Code gerado
 * - message: Nova mensagem recebida/enviada
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json(
        { error: 'Formato de webhook inválido. Campos "event" e "data" são obrigatórios.' },
        { status: 400 }
      );
    }

    console.log(`[Webhook chat-whatsapp] Evento recebido: ${event}`, data);

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'status':
        // Status mudou (connected/disconnected)
        await handleStatusEvent(data);
        break;

      case 'qr':
        // QR Code foi gerado
        await handleQREvent(data);
        break;

      case 'message':
        // Nova mensagem recebida/enviada
        await handleMessageEvent(data);
        break;

      default:
        console.warn(`[Webhook chat-whatsapp] Evento desconhecido: ${event}`);
    }

    // Retornar 200 para confirmar recebimento
    return NextResponse.json({ status: 'ok', received: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook chat-whatsapp] Erro ao processar webhook:', error);
    
    // Retornar 200 mesmo em caso de erro para evitar retries desnecessários
    return NextResponse.json(
      { 
        error: 'Erro interno', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 200 }
    );
  }
}

/**
 * Processa evento de mudança de status
 */
async function handleStatusEvent(data: any) {
  const { connected, clientInfo } = data;
  
  console.log(`[Webhook chat-whatsapp] Status atualizado: connected=${connected}`);
  
  // Aqui você pode:
  // - Atualizar estado no banco de dados
  // - Notificar usuários via WebSocket/SSE
  // - Disparar outras ações baseadas no status
  
  // Por enquanto, apenas logamos
  if (clientInfo) {
    console.log(`[Webhook chat-whatsapp] Info do cliente:`, clientInfo);
  }
}

/**
 * Processa evento de QR Code gerado
 */
async function handleQREvent(data: any) {
  const { qr, available } = data;
  
  console.log(`[Webhook chat-whatsapp] QR Code atualizado: available=${available}`);
  
  // Aqui você pode:
  // - Atualizar estado no frontend via WebSocket/SSE
  // - Notificar usuários que um novo QR Code está disponível
}

/**
 * Processa evento de nova mensagem
 */
async function handleMessageEvent(data: any) {
  const { message } = data;
  
  console.log(`[Webhook chat-whatsapp] Nova mensagem:`, {
    id: message.id,
    from: message.from,
    to: message.to,
    direction: message.direction,
    content: message.content?.substring(0, 50) + '...'
  });
  
  // Aqui você pode:
  // - Salvar mensagem no banco de dados
  // - Atualizar frontend em tempo real via WebSocket/SSE
  // - Processar mensagem e gerar resposta automática
}

