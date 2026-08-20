import { Message } from './Message';

export function mediaLookupFromMessage(message: Message): {
  remoteJid: string;
  fromMe: boolean;
} {
  const phone = message.direction === 'incoming' ? message.from : message.to;
  return {
    remoteJid: phone.includes('@') ? phone : `${phone}@s.whatsapp.net`,
    fromMe: message.direction === 'outgoing',
  };
}
