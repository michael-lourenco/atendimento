import { evolutionQuotedBody } from './evolutionQuoted';

describe('evolutionQuotedBody', () => {
  it('vazio sem alvo', () => {
    expect(evolutionQuotedBody(undefined, '5511')).toEqual({});
  });

  it('monta key quoted', () => {
    expect(
      evolutionQuotedBody(
        { messageId: 'abc', fromMe: false, preview: 'oi' },
        '5511999'
      )
    ).toEqual({
      quoted: {
        key: { id: 'abc', fromMe: false, remoteJid: '5511999@s.whatsapp.net' },
        message: { conversation: 'oi' },
      },
    });
  });
});
