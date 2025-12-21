import { NextRequest, NextResponse } from 'next/server';
import { ChatWhatsAppService } from '@/infra/whatsapp/ChatWhatsAppService';

/**
 * API Route para obter status da conexão WhatsApp
 * GET /api/chat-whatsapp/status
 */
export async function GET(request: NextRequest) {
  try {
    const service = new ChatWhatsAppService();
    const status = await service.getStatus();
    
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    
    return NextResponse.json(
      {
        error: 'Erro ao obter status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

