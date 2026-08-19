import { MAX_OUTGOING_MEDIA_BYTES } from '@/core/services/IMediaStorage';
import { OutgoingMedia } from '@/core/services/IWhatsAppService';
import { SendWhatsAppMessageInput } from '@/core/usecases/SendWhatsAppMessageUseCase';

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
  return parseJson(await request.json());
}

function parseJson(body: unknown): SendWhatsAppMessageInput {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const to = typeof record.to === 'string' ? record.to.trim() : '';
  const message = typeof record.message === 'string' ? record.message : '';
  const type = record.type === 'template' || record.type === 'text' ? record.type : undefined;
  const templateName = typeof record.templateName === 'string' ? record.templateName : undefined;
  const templateParams = Array.isArray(record.templateParams)
    ? record.templateParams.filter((item): item is string => typeof item === 'string')
    : undefined;

  if (!to) {
    throw new SendRequestError('Campo obrigatório: to');
  }
  if (!message.trim()) {
    throw new SendRequestError('Campos obrigatórios: to, message');
  }
  if (type === 'template' && !templateName) {
    throw new SendRequestError('templateName é obrigatório quando type é "template"');
  }

  return { to, message, type, templateName, templateParams };
}

async function parseMultipart(form: FormData): Promise<SendWhatsAppMessageInput> {
  const to = String(form.get('to') ?? '').trim();
  const message = String(form.get('message') ?? '');
  const file = form.get('file');
  const media =
    file instanceof File && file.size > 0 ? await toOutgoingMedia(file) : undefined;

  if (!to) {
    throw new SendRequestError('Campo obrigatório: to');
  }
  if (!message.trim() && !media) {
    throw new SendRequestError('Envie uma mensagem ou um arquivo');
  }

  return { to, message, media };
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
