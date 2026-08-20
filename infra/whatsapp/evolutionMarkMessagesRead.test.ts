import { evolutionReadMessagesBody } from './evolutionMarkMessagesRead';

describe('evolutionReadMessagesBody', () => {
  it('monta readMessages com fromMe false', () => {
    expect(evolutionReadMessagesBody('55 11 99999-0000', ['BAE5A', 'BAE5B'])).toEqual({
      readMessages: [
        { remoteJid: '5511999990000@s.whatsapp.net', fromMe: false, id: 'BAE5A' },
        { remoteJid: '5511999990000@s.whatsapp.net', fromMe: false, id: 'BAE5B' },
      ],
    });
  });
});
