import { NextRequest, NextResponse } from 'next/server';
import { SendWhatsAppMessageUseCase } from '@/core/usecases/SendWhatsAppMessageUseCase';

/**
 * API para enviar mensagens via WhatsApp
 * 
 * POST /api/messages/send
 * Body: { to: string, message: string, type?: 'text' | 'template', templateName?: string, templateParams?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, type, templateName, templateParams } = body;

    // Validação básica
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: to, message' },
        { status: 400 }
      );
    }

    // Validação para templates
    if (type === 'template' && !templateName) {
      return NextResponse.json(
        { error: 'templateName é obrigatório quando type é "template"' },
        { status: 400 }
      );
    }

    const useCase = new SendWhatsAppMessageUseCase();
    const result = await useCase.execute({
      to,
      message,
      type,
      templateName,
      templateParams,
    });

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



