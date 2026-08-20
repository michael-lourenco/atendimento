import { mapEvolutionIncomingMessages, mapEvolutionReactions } from './mapEvolutionIncoming';

describe('mapEvolutionIncomingMessages', () => {
  const instance = 'default';

  it('traz o pushName da pessoa', () => {
    const messages = mapEvolutionIncomingMessages(
      {
        event: 'messages.upsert',
        data: {
          pushName: 'Carlos Souza',
          messageTimestamp: 1700000000,
          key: { id: 'abc', remoteJid: '5511988887777@s.whatsapp.net', fromMe: false },
          message: { conversation: 'oi' },
        },
      },
      instance
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].contactName).toBe('Carlos Souza');
    expect(messages[0].from).toBe('5511988887777');
    expect(messages[0].content).toBe('oi');
  });

  it('aceita evento MESSAGES_UPSERT', () => {
    const messages = mapEvolutionIncomingMessages(
      {
        event: 'MESSAGES_UPSERT',
        data: {
          pushName: 'Ana',
          messageTimestamp: 1700000000,
          key: { id: 'x', remoteJid: '5511911112222@s.whatsapp.net', fromMe: false },
          message: { conversation: 'nova' },
        },
      },
      instance
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('nova');
  });

  it('mensagem enviada no celular (fromMe) vira saída para o contato', () => {
    const messages = mapEvolutionIncomingMessages(
      {
        event: 'messages.upsert',
        data: {
          pushName: 'Eu',
          messageTimestamp: 1700000000,
          key: { id: 'me', remoteJid: '5521982790723@s.whatsapp.net', fromMe: true },
          message: { conversation: 'falando pelo zap' },
        },
      },
      instance
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].direction).toBe('outgoing');
    expect(messages[0].to).toBe('5521982790723');
    expect(messages[0].from).toBe(instance);
  });

  it('ignora grupo', () => {
    expect(
      mapEvolutionIncomingMessages(
        {
          event: 'messages.upsert',
          data: {
            pushName: 'Grupo',
            key: { id: 'g', remoteJid: '1203630@g.us', fromMe: false },
            message: { conversation: 'oi' },
          },
        },
        instance
      )
    ).toEqual([]);
  });

  it('mapeia imagem com caption', () => {
    const messages = mapEvolutionIncomingMessages(
      {
        event: 'messages.upsert',
        data: {
          pushName: 'Ana',
          messageTimestamp: 1700000000,
          key: { id: 'img1', remoteJid: '5511999@s.whatsapp.net', fromMe: false },
          message: { imageMessage: { caption: 'foto da loja', mimetype: 'image/jpeg' } },
        },
      },
      instance
    );
    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('image');
    expect(messages[0].content).toBe('foto da loja');
  });

  it('reactionMessage não vira bolha e mapeia o alvo', () => {
    const payload = {
      event: 'messages.upsert',
      data: {
        key: { id: 'rx', remoteJid: '5511988887777@s.whatsapp.net', fromMe: false },
        message: {
          reactionMessage: {
            key: { id: 'm1', fromMe: true },
            text: '👍',
          },
        },
      },
    };
    expect(mapEvolutionIncomingMessages(payload, 'comercial')).toEqual([]);
    expect(mapEvolutionReactions(payload, 'comercial')).toEqual([
      { targetId: 'm1', from: '5511988887777', emoji: '👍' },
    ]);
  });
});
