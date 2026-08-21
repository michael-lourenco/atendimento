import { Conversation } from '@/core/entities/Conversation';
import { shouldPlayInboxSound, inboxDocumentTitle, inboxUnreadTotal, shouldBoostInboxChime, isInboxChimeMuted } from './inbox-notify';

const conv = (phone: string, unreadCount: number): Conversation => ({
  id: phone,
  contactId: phone,
  contactName: phone,
  contactPhone: phone,
  status: 'open',
  unreadCount,
  lastActivity: new Date(),
  createdAt: new Date(),
  tags: [],
});

describe('shouldPlayInboxSound', () => {
  it('does not play on the first load', () => {
    expect(shouldPlayInboxSound(null, [conv('1', 2)])).toBe(false);
  });

  it('plays when unread count rises', () => {
    expect(shouldPlayInboxSound([conv('1', 0)], [conv('1', 1)])).toBe(true);
  });

  it('plays when a new conversation appears', () => {
    expect(shouldPlayInboxSound([conv('1', 0)], [conv('1', 0), conv('2', 0)])).toBe(true);
  });

  it('plays when the same phone opens a second line', () => {
    const first: Conversation = { ...conv('1', 0), id: '1:n1', whatsappNumberId: 'n1' };
    const second: Conversation = { ...conv('1', 0), id: '1:n2', whatsappNumberId: 'n2' };
    expect(shouldPlayInboxSound([first], [first, second])).toBe(true);
  });

  it('stays quiet when nothing new arrived', () => {
    expect(shouldPlayInboxSound([conv('1', 1)], [conv('1', 1)])).toBe(false);
  });
});

describe('inboxDocumentTitle', () => {
  it('prefixa não lidas', () => {
    expect(inboxDocumentTitle(0)).toBe('Conversas');
    expect(inboxDocumentTitle(3)).toBe('(3) Conversas');
    expect(inboxUnreadTotal([conv('1', 2), conv('2', 1)])).toBe(3);
  });
});

describe('shouldBoostInboxChime', () => {
  it('reforça no primeiro toque do dia', () => {
    expect(shouldBoostInboxChime('2026-08-20', null)).toBe(true);
    expect(shouldBoostInboxChime('2026-08-20', '2026-08-19')).toBe(true);
  });

  it('não reforça de novo no mesmo dia', () => {
    expect(shouldBoostInboxChime('2026-08-20', '2026-08-20')).toBe(false);
  });
});

describe('isInboxChimeMuted', () => {
  it('silencia só com 1', () => {
    expect(isInboxChimeMuted('1')).toBe(true);
    expect(isInboxChimeMuted('0')).toBe(false);
    expect(isInboxChimeMuted(null)).toBe(false);
  });
});
