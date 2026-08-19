import { Conversation } from '@/core/entities/Conversation';
import { shouldPlayInboxSound } from './inbox-notify';

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

  it('stays quiet when nothing new arrived', () => {
    expect(shouldPlayInboxSound([conv('1', 1)], [conv('1', 1)])).toBe(false);
  });
});
