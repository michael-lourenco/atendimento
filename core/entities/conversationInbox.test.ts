import { conversationAvatarLetter, conversationDisplayName, conversationPhotoUrl, conversationPreview, conversationPreviewIsOutgoing, formatInboxTime } from './conversationInbox';
import { Message } from './Message';

const text = (overrides: Partial<Message> = {}): Message => ({
  id: '1',
  from: 'a',
  to: 'b',
  content: 'oi',
  type: 'text',
  timestamp: new Date(),
  direction: 'incoming',
  status: 'delivered',
  ...overrides,
});

describe('conversationInbox', () => {
  it('usa o nome quando não é o próprio telefone', () => {
    expect(
      conversationDisplayName({ contactName: 'Maria', contactPhone: '5521999' })
    ).toBe('Maria');
    expect(
      conversationDisplayName({ contactName: '5521999', contactPhone: '5521999' })
    ).toBe('5521999');
  });

  it('inicial do avatar', () => {
    expect(conversationAvatarLetter('Maria')).toBe('M');
    expect(conversationAvatarLetter('  ana')).toBe('A');
    expect(conversationAvatarLetter('')).toBe('?');
  });

  it('href da foto', () => {
    expect(conversationPhotoUrl({})).toBeUndefined();
    expect(conversationPhotoUrl({ contactAvatarUrl: '  ' })).toBeUndefined();
    expect(conversationPhotoUrl({ contactAvatarUrl: '/api/contacts/5511/avatar' })).toBe(
      '/api/contacts/5511/avatar'
    );
  });

  it('prévia no estilo WhatsApp', () => {
    expect(conversationPreview({})).toBe('Sem mensagens');
    expect(conversationPreview({ lastMessage: text({ content: '  oi  ' }) })).toBe('oi');
    expect(conversationPreview({ lastMessage: text({ content: 'tá', direction: 'outgoing' }) })).toBe(
      'Você: tá'
    );
    expect(conversationPreview({ lastMessage: text({ type: 'image', content: '' }) })).toBe('Foto');
    expect(conversationPreview({ lastMessage: text({ type: 'audio', content: 'Áudio enviado' }) })).toBe(
      'Áudio'
    );
    expect(
      conversationPreview({ lastMessage: text({ type: 'image', content: 'olha isso', direction: 'outgoing' }) })
    ).toBe('Você: olha isso');
    expect(conversationPreviewIsOutgoing({ lastMessage: text({ direction: 'outgoing' }) })).toBe(true);
    expect(conversationPreviewIsOutgoing({ lastMessage: text({ direction: 'incoming' }) })).toBe(false);
    expect(conversationPreviewIsOutgoing({})).toBe(false);
  });

  it('digitando cobre a prévia', () => {
    const now = new Date('2026-08-20T12:00:10Z');
    expect(
      conversationPreview(
        {
          lastMessage: text({ content: 'oi' }),
          contactTypingAt: new Date('2026-08-20T12:00:00Z'),
        },
        now
      )
    ).toBe('digitando…');
    expect(
      conversationPreviewIsOutgoing(
        {
          lastMessage: text({ direction: 'outgoing' }),
          contactTypingAt: new Date('2026-08-20T12:00:00Z'),
        },
        now
      )
    ).toBe(false);
    expect(
      conversationPreview(
        {
          lastMessage: text({ content: 'oi' }),
          contactTypingAt: new Date('2026-08-20T11:59:00Z'),
        },
        now
      )
    ).toBe('oi');
  });

  it('hoje mostra hora, outro dia mostra data', () => {
    const now = new Date('2026-08-18T15:00:00');
    const today = formatInboxTime(new Date('2026-08-18T09:05:00'), now);
    const other = formatInboxTime(new Date('2026-08-10T09:05:00'), now);
    expect(today).not.toMatch(/\//);
    expect(other).toMatch(/\//);
  });
});
