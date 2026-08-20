import {
  DEFAULT_BOT_BEHAVIOR,
  ZERO_BOT_BEHAVIOR,
  contactStillTyping,
  mergeBotBehavior,
  msToSeconds,
  resolveBotBehavior,
  secondsToMs,
} from './botBehavior';

describe('mergeBotBehavior', () => {
  it('usa o padrão quando não há valor', () => {
    expect(mergeBotBehavior()).toEqual(DEFAULT_BOT_BEHAVIOR);
  });

  it('corta delay acima do teto', () => {
    expect(mergeBotBehavior({ replyDelayMs: 9000 }).replyDelayMs).toBe(5000);
    expect(mergeBotBehavior({ bubbleDelayMs: 9000 }).bubbleDelayMs).toBe(8000);
    expect(mergeBotBehavior({ inboundDebounceMs: 9000 }).inboundDebounceMs).toBe(3000);
  });

  it('preserva 0 no silêncio (desliga)', () => {
    expect(mergeBotBehavior({ idleContactMinutes: 0 }).idleContactMinutes).toBe(0);
  });
});

describe('resolveBotBehavior', () => {
  it('sem catálogo de bots zera os delays', () => {
    expect(resolveBotBehavior(null)).toEqual(ZERO_BOT_BEHAVIOR);
  });

  it('sem bot ativo zera os delays', () => {
    expect(resolveBotBehavior([{ isActive: false, behavior: DEFAULT_BOT_BEHAVIOR }])).toEqual(
      ZERO_BOT_BEHAVIOR
    );
  });

  it('usa o bot ativo', () => {
    expect(
      resolveBotBehavior([{ isActive: true, behavior: { replyDelayMs: 200 } }]).replyDelayMs
    ).toBe(200);
  });

  it('a linha sobrepõe o ritmo da empresa', () => {
    expect(
      resolveBotBehavior([{ isActive: true, behavior: { replyDelayMs: 1000 } }], {
        replyDelayMs: 200,
      }).replyDelayMs
    ).toBe(200);
  });
});

describe('contactStillTyping', () => {
  it('considera fresco dentro da margem', () => {
    const now = new Date('2026-08-20T15:00:01.000Z');
    expect(contactStillTyping(new Date('2026-08-20T15:00:00.000Z'), 1500, now)).toBe(true);
    expect(contactStillTyping(new Date('2026-08-20T14:59:58.000Z'), 1500, now)).toBe(false);
  });
});

describe('segundos na tela', () => {
  it('converte milissegundos e devolve inteiro em ms', () => {
    expect(msToSeconds(1500)).toBe(1.5);
    expect(secondsToMs(1.5, 0)).toBe(1500);
    expect(secondsToMs('abc', 800)).toBe(800);
  });
});
