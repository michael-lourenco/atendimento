import { QuotedMessageRef } from '../../core/services/IWhatsAppService';

export function evolutionQuotedBody(quoted: QuotedMessageRef | undefined, chatNumber: string): Record<string, unknown> {
  if (!quoted?.messageId) {
    return {};
  }
  const remote =
    quoted.remoteJid?.trim() ||
    `${chatNumber.replace(/\D/g, '')}@s.whatsapp.net`;
  return {
    quoted: {
      key: {
        id: quoted.messageId,
        fromMe: quoted.fromMe,
        remoteJid: remote,
      },
      ...(quoted.preview
        ? { message: { conversation: quoted.preview } }
        : {}),
    },
  };
}
