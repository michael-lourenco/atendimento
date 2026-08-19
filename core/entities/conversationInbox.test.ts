import { conversationDisplayName, conversationPreview, formatInboxTime } from './conversationInbox';

describe('conversationInbox', () => {
  it('usa o nome quando não é o próprio telefone', () => {
    expect(
      conversationDisplayName({ contactName: 'Maria', contactPhone: '5521999' })
    ).toBe('Maria');
    expect(
      conversationDisplayName({ contactName: '5521999', contactPhone: '5521999' })
    ).toBe('5521999');
  });

  it('prévia cai em Sem mensagens', () => {
    expect(conversationPreview({})).toBe('Sem mensagens');
    expect(
      conversationPreview({
        lastMessage: {
          id: '1',
          from: 'a',
          to: 'b',
          content: '  oi  ',
          type: 'text',
          timestamp: new Date(),
          direction: 'incoming',
          status: 'delivered',
        },
      })
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
