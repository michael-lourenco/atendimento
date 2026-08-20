export type BotBehavior = {
  replyDelayMs: number;
  bubbleDelayMs: number;
  sendComposing: boolean;
  waitWhileTyping: boolean;
  typingIdleMs: number;
  inboundDebounceMs: number;
  idleContactMinutes: number;
  idleCloseMessage: string;
};

export const DEFAULT_BOT_BEHAVIOR: BotBehavior = {
  replyDelayMs: 1000,
  bubbleDelayMs: 500,
  sendComposing: true,
  waitWhileTyping: true,
  typingIdleMs: 1500,
  inboundDebounceMs: 800,
  idleContactMinutes: 30,
  idleCloseMessage:
    'Como não tivemos retorno, encerramos este atendimento. Quando quiser, é só chamar de novo.',
};

export const ZERO_BOT_BEHAVIOR: BotBehavior = {
  replyDelayMs: 0,
  bubbleDelayMs: 0,
  sendComposing: false,
  waitWhileTyping: false,
  typingIdleMs: 0,
  inboundDebounceMs: 0,
  idleContactMinutes: 0,
  idleCloseMessage: '',
};

const TYPING_WAIT_CAP_MS = 8000;

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function mergeBotBehavior(partial?: Partial<BotBehavior> | null): BotBehavior {
  const base = DEFAULT_BOT_BEHAVIOR;
  if (!partial) {
    return { ...base };
  }
  return {
    replyDelayMs: clamp(partial.replyDelayMs, 0, 5000, base.replyDelayMs),
    bubbleDelayMs: clamp(partial.bubbleDelayMs, 0, 8000, base.bubbleDelayMs),
    sendComposing: partial.sendComposing ?? base.sendComposing,
    waitWhileTyping: partial.waitWhileTyping ?? base.waitWhileTyping,
    typingIdleMs: clamp(partial.typingIdleMs, 0, 5000, base.typingIdleMs),
    inboundDebounceMs: clamp(partial.inboundDebounceMs, 0, 3000, base.inboundDebounceMs),
    idleContactMinutes: clamp(partial.idleContactMinutes, 0, 24 * 60, base.idleContactMinutes),
    idleCloseMessage:
      typeof partial.idleCloseMessage === 'string'
        ? partial.idleCloseMessage
        : base.idleCloseMessage,
  };
}

export function resolveBotBehavior(
  bots: { isActive: boolean; behavior?: Partial<BotBehavior> }[] | null
): BotBehavior {
  if (!bots) {
    return { ...ZERO_BOT_BEHAVIOR };
  }
  const active = bots.find((item) => item.isActive);
  if (!active) {
    return { ...ZERO_BOT_BEHAVIOR };
  }
  return mergeBotBehavior(active.behavior);
}

export function contactStillTyping(
  typingAt: Date | undefined,
  idleMs: number,
  now = new Date()
): boolean {
  if (!typingAt || idleMs <= 0) {
    return false;
  }
  const stamp = typingAt instanceof Date ? typingAt : new Date(typingAt);
  return now.getTime() - stamp.getTime() <= idleMs;
}

export function typingWaitCapMs(): number {
  return TYPING_WAIT_CAP_MS;
}
