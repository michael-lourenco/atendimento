import { Conversation } from './Conversation';
import { Message } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';
import { conversationThreadId, digitsPhone, findConversationThread } from './conversationThread';
import { matchWhatsAppNumber } from './whatsappNumberLine';

export type FlowAudience = 'new' | 'known';

export type IncomingFlowHint = {
  sessionKey: string;
  audience: FlowAudience;
  reopened: boolean;
};

export function resolveFlowAudience(input: {
  threadExisted: boolean;
  contactExisted: boolean;
}): FlowAudience {
  if (input.threadExisted && input.contactExisted) {
    return 'known';
  }
  return 'new';
}

export function incomingFlowHints(input: {
  messages: Message[];
  conversations: Conversation[];
  existingContactIds: ReadonlySet<string>;
  catalog: WhatsAppNumber[];
}): IncomingFlowHint[] {
  const hints: IncomingFlowHint[] = [];
  for (const message of input.messages) {
    if (message.direction !== 'incoming' || message.type !== 'text') {
      continue;
    }
    if (!message.content.trim()) {
      continue;
    }
    const phone = digitsPhone(message.direction === 'incoming' ? message.from : message.to);
    const line = matchWhatsAppNumber(input.catalog, message.to);
    const sessionKey = conversationThreadId(phone, line?.id);
    const thread = findConversationThread(input.conversations, phone, line?.id);
    hints.push({
      sessionKey,
      audience: resolveFlowAudience({
        threadExisted: Boolean(thread),
        contactExisted: input.existingContactIds.has(phone),
      }),
      reopened: Boolean(thread && thread.status === 'closed'),
    });
  }
  return hints;
}
