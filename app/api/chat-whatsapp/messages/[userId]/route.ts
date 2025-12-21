import { NextRequest, NextResponse } from 'next/server';
import { ChatWhatsAppService } from '@/infra/whatsapp/ChatWhatsAppService';

/**
 * API Route para obter mensagens de um usuário específico
 * GET /api/chat-whatsapp/messages/[userId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }
    
    const service = new ChatWhatsAppService();
    const messages = await service.getMessagesByUser(userId);
    
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter mensagens do usuário:', error);
    
    return NextResponse.json(
      {
        error: 'Erro ao obter mensagens do usuário',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

