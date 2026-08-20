import { MAX_OUTGOING_MEDIA_BYTES } from '@/core/services/IMediaStorage';
import { OutgoingMedia } from '@/core/services/IWhatsAppService';
import { SendWhatsAppMessageInput } from '@/core/usecases/SendWhatsAppMessageUseCase';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { sendMessageJsonSchema } from '@/infra/http/schemas';

export class SendRequestError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
  }
}

export async function parseSendRequest(request: Request): Promise<SendWhatsAppMessageInput> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    return parseMultipart(await request.formData());
  }
  try {
    return await parseJsonBody(request, sendMessageJsonSchema);
  } catch (error) {
    if (error instanceof HttpBodyError) {
      throw new SendRequestError(error.message, error.status);
    }
    throw error;
  }
}

async function parseMultipart(form: FormData): Promise<SendWhatsAppMessageInput> {
  const to = String(form.get('to') ?? '').trim();
  const message = String(form.get('message') ?? '');
  const conversationId = String(form.get('conversationId') ?? '').trim() || undefined;
  const quotedMessageId = String(form.get('quotedMessageId') ?? '').trim() || undefined;
  const file = form.get('file');
  const media =
    file instanceof File && file.size > 0 ? await toOutgoingMedia(file) : undefined;

  if (!to) {
    throw new SendRequestError('Campo obrigatório: to');
  }
  if (!message.trim() && !media) {
    throw new SendRequestError('Envie uma mensagem ou um arquivo');
  }

  return { to, message, media, conversationId, quotedMessageId };
}

export function assertOutgoingMediaSize(size: number): void {
  if (size > MAX_OUTGOING_MEDIA_BYTES) {
    throw new SendRequestError('Arquivo maior que 16 MB');
  }
}

async function toOutgoingMedia(file: File): Promise<OutgoingMedia> {
  assertOutgoingMediaSize(file.size);
  return {
    mimeType: file.type || 'application/octet-stream',
    fileName: file.name || 'file',
    bytes: new Uint8Array(await file.arrayBuffer()),
  };
}
