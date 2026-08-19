import { Conversation } from './Conversation';
import { WhatsAppNumber } from './WhatsAppNumber';
import {
  AVATAR_BACKFILL_BATCH,
  conversationsNeedingAvatarPhoto,
} from './contactAvatarBackfill';

describe('conversationsNeedingAvatarPhoto', () => {
  const now = new Date('2026-08-19');
  const numbers: WhatsAppNumber[] = [
    {
      id: 'line-a',
      name: 'Comercial',
      number: '5511000',
      status: 'active',
      provider: 'evolution',
      instanceName: 'comercial',
      createdAt: now,
    },
  ];

  function thread(id: string, phone: string, avatar?: string, line?: string): Conversation {
    return {
      id,
      contactId: phone,
      contactName: id,
      contactPhone: phone,
      status: 'open',
      unreadCount: 0,
      lastActivity: now,
      createdAt: now,
      tags: [],
      contactAvatarUrl: avatar,
      whatsappNumberId: line,
    };
  }

  it('lista threads sem foto, um alvo por telefone', () => {
    const targets = conversationsNeedingAvatarPhoto(
      [
        thread('a', '55111', undefined, 'line-a'),
        thread('b', '55111', undefined, 'line-a'),
        thread('c', '55122', '/api/contacts/55122/avatar'),
        thread('d', '55133'),
      ],
      numbers
    );
    expect(targets.map((item) => item.phone)).toEqual(['55111', '55133']);
    expect(targets[0].instanceName).toBe('comercial');
    expect(targets[1].instanceName).toBeUndefined();
  });

  it('lote é constante positiva', () => {
    expect(AVATAR_BACKFILL_BATCH).toBeGreaterThan(0);
  });
});
