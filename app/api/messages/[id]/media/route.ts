import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';
import { EvolutionWhatsAppService } from '@/infra/whatsapp/EvolutionWhatsAppService';
import { resolvePlayableMedia } from '@/infra/whatsapp/evolutionMedia';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isPublicSupabaseConfigured()) {
      const operator = await getOperatorUser();
      if (!operator) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    const message = await serverLocator.getRepos().message.getById(id);
    if (!message) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });
    }

    const whatsApp = serverLocator.getWhatsAppService();
    const file = await resolvePlayableMedia({
      message,
      storage: serverLocator.getMediaStorage(),
      download:
        whatsApp instanceof EvolutionWhatsAppService
          ? (input) => whatsApp.downloadMedia(input)
          : undefined,
    });

    if (!file) {
      return NextResponse.json({ error: 'Mídia indisponível' }, { status: 404 });
    }

    return new NextResponse(Buffer.from(file.bytes), {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Erro ao obter mídia da mensagem:', error);
    return NextResponse.json(
      {
        error: 'Erro ao obter mídia',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
