import { WhatsAppNumber } from './WhatsAppNumber';
import {
  LIVE_WHATSAPP_NUMBER_ID,
  digitsFromWhatsAppWid,
  liveWhatsAppCatalogId,
  liveWhatsAppNumberForCatalog,
  liveWhatsAppNumberNeedsSave,
  mergeWhatsAppNumbersWithLive,
} from './whatsappNumberLive';

const catalogRow = (overrides: Partial<WhatsAppNumber> = {}): WhatsAppNumber => ({
  id: 'n-1',
  name: 'Loja',
  number: '5511999887766',
  status: 'inactive',
  provider: 'meta',
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

const live = {
  connected: true as const,
  wid: '5511999887766@s.whatsapp.net',
  pushname: 'Atimo',
  platform: 'evolution',
};

describe('digitsFromWhatsAppWid', () => {
  it('tira o sufixo do JID', () => {
    expect(digitsFromWhatsAppWid('5511999887766@s.whatsapp.net')).toBe('5511999887766');
  });

  it('ignora o device id depois dos dois pontos', () => {
    expect(digitsFromWhatsAppWid('5511999887766:12@s.whatsapp.net')).toBe('5511999887766');
  });
});

describe('liveWhatsAppNumberForCatalog', () => {
  it('monta um cadastro estável na primeira conexão', () => {
    const now = new Date('2026-08-18');
    const row = liveWhatsAppNumberForCatalog([], live, now);
    expect(row).toEqual({
      id: liveWhatsAppCatalogId('5511999887766'),
      name: 'Atimo',
      number: '5511999887766',
      status: 'active',
      provider: 'evolution',
      createdAt: now,
    });
  });

  it('não monta cadastro sem dígitos ou desconectado', () => {
    expect(liveWhatsAppNumberForCatalog([], { ...live, connected: false })).toBeNull();
    expect(liveWhatsAppNumberForCatalog([], { ...live, wid: null })).toBeNull();
  });
});

describe('liveWhatsAppNumberNeedsSave', () => {
  it('pede gravação só quando muda nome, número, status ou provedor', () => {
    const next = liveWhatsAppNumberForCatalog([], live, new Date('2026-08-18'))!;
    expect(liveWhatsAppNumberNeedsSave(undefined, next)).toBe(true);
    expect(liveWhatsAppNumberNeedsSave(next, next)).toBe(false);
    expect(liveWhatsAppNumberNeedsSave({ ...next, name: 'Outro' }, next)).toBe(true);
  });
});

describe('mergeWhatsAppNumbersWithLive', () => {
  it('deixa o catálogo como está se a sessão não estiver conectada', () => {
    const catalog = [catalogRow()];
    expect(
      mergeWhatsAppNumbersWithLive(catalog, {
        connected: false,
        wid: '5511999887766@s.whatsapp.net',
        pushname: 'Atimo',
      })
    ).toEqual(catalog);
  });

  it('mostra a sessão ao vivo quando o catálogo está vazio', () => {
    const rows = mergeWhatsAppNumbersWithLive([], live);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(liveWhatsAppCatalogId('5511999887766'));
    expect(rows[0].number).toBe('5511999887766');
    expect(rows[0].name).toBe('Atimo');
    expect(rows[0].status).toBe('active');
  });

  it('mostra sessão ativa sem JID', () => {
    const rows = mergeWhatsAppNumbersWithLive([], { ...live, wid: null });
    expect(rows[0].id).toBe(LIVE_WHATSAPP_NUMBER_ID);
    expect(rows[0].number).toBe('Sessão ativa');
  });

  it('atualiza o cadastro que já tem o mesmo número', () => {
    const hours = {
      enabled: false,
      timezone: 'UTC',
      days: [] as number[],
      start: '08:00',
      end: '18:00',
      closedMessage: '',
    };
    const rows = mergeWhatsAppNumbersWithLive(
      [catalogRow({ behavior: { replyDelayMs: 200 }, flowId: 'faq', businessHours: hours })],
      live
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('n-1');
    expect(rows[0].status).toBe('active');
    expect(rows[0].name).toBe('Atimo');
    expect(rows[0].behavior).toEqual({ replyDelayMs: 200 });
    expect(rows[0].flowId).toBe('faq');
    expect(rows[0].businessHours).toEqual(hours);
  });
});
