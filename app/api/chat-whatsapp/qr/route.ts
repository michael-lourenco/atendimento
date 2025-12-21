import { NextRequest, NextResponse } from 'next/server';
import { ChatWhatsAppService } from '@/infra/whatsapp/ChatWhatsAppService';

/**
 * API Route para obter QR Code do chat-whatsapp
 * GET /api/chat-whatsapp/qr
 */
export async function GET(request: NextRequest) {
  try {
    const service = new ChatWhatsAppService();
    const qrData = await service.getQRCode();
    
    return NextResponse.json(qrData, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    
    // Log detalhado para debug
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const baseUrl = process.env.CHAT_WHATSAPP_API_URL || 'http://localhost:3000';
    console.error(`Tentando conectar em: ${baseUrl}/api/qr`);
    
    return NextResponse.json(
      {
        error: 'Erro ao obter QR Code',
        message: errorMessage,
        details: {
          baseUrl,
          hint: 'Verifique se CHAT_WHATSAPP_API_URL está configurado corretamente no .env.local'
        }
      },
      { status: 500 }
    );
  }
}

