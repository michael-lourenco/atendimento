import { BotBehavior, contactStillTyping, typingWaitCapMs } from '../entities/botBehavior';
import { Conversation } from '../entities/Conversation';
import { SendWhatsAppPresenceUseCase } from './SendWhatsAppPresenceUseCase';

const TYPING_POLL_MS = 200;

export async function waitBotRhythm(input: {
  waitMs: number;
  behavior: BotBehavior;
  loadConversation?: () => Promise<Conversation | null>;
  presence?: SendWhatsAppPresenceUseCase | null;
  to: string;
  instanceName?: string;
  sleep: (ms: number) => Promise<void>;
  now?: () => Date;
}): Promise<void> {
  const waitMs = Math.max(0, input.waitMs);
  if (waitMs > 0 && input.behavior.sendComposing && input.presence) {
    await input.presence.execute({
      to: input.to,
      presence: 'composing',
      instanceName: input.instanceName,
      delayMs: waitMs,
    });
  }
  if (waitMs > 0) {
    await input.sleep(waitMs);
  }
  if (!input.behavior.waitWhileTyping || !input.loadConversation) {
    return;
  }
  const now = input.now ?? (() => new Date());
  const started = now().getTime();
  while (now().getTime() - started < typingWaitCapMs()) {
    const conversation = await input.loadConversation();
    if (!contactStillTyping(conversation?.contactTypingAt, input.behavior.typingIdleMs, now())) {
      return;
    }
    await input.sleep(TYPING_POLL_MS);
  }
}
