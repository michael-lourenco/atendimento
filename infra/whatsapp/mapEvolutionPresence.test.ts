import { mapEvolutionPresence, isEvolutionPresenceEvent } from './mapEvolutionPresence';

describe('mapEvolutionPresence', () => {
  it('lê composing no mapa presences', () => {
    expect(
      mapEvolutionPresence({
        event: 'presence.update',
        data: {
          presences: {
            '5511999887766@s.whatsapp.net': { lastKnownPresence: 'composing' },
          },
        },
      })
    ).toEqual([{ phone: '5511999887766', composing: true }]);
  });

  it('paused zera', () => {
    expect(
      mapEvolutionPresence({
        event: 'PRESENCE_UPDATE',
        data: { remoteJid: '5511999887766@s.whatsapp.net', presence: 'paused' },
      })
    ).toEqual([{ phone: '5511999887766', composing: false }]);
  });

  it('ignora grupo', () => {
    expect(
      mapEvolutionPresence({
        event: 'presence.update',
        data: { remoteJid: '1203630@g.us', presence: 'composing' },
      })
    ).toEqual([]);
  });

  it('só presence.update', () => {
    expect(isEvolutionPresenceEvent('messages.upsert')).toBe(false);
    expect(isEvolutionPresenceEvent('presence.update')).toBe(true);
  });
});
