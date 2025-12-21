import { NextRequest, NextResponse } from 'next/server';
import { ChatWhatsAppService } from '@/infra/whatsapp/ChatWhatsAppService';

/**
 * API Route para listar mensagens do chat-whatsapp
 * GET /api/chat-whatsapp/messages?limit=50&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const service = new ChatWhatsAppService();
    const messages = await service.getMessages(limit, offset);
    
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter mensagens:', error);
    
    return NextResponse.json(
      {
        error: 'Erro ao obter mensagens',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para enviar mensagem via chat-whatsapp
 * POST /api/chat-whatsapp/messages
 * Body: { to: string, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = body;
    
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: to, message' },
        { status: 400 }
      );
    }
    
    const service = new ChatWhatsAppService();
    const result = await service.sendMessage(to, message);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
    return NextResponse.json(
      {
        error: 'Erro ao enviar mensagem',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

