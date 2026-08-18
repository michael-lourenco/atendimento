import { mapEvolutionConnectToQr, mapEvolutionState } from './evolutionConnectionMap';

describe('evolutionConnectionMap', () => {
  it('expõe base64 como QR quando desconectado', () => {
    const mapped = mapEvolutionConnectToQr(
      { base64: 'data:image/png;base64,abc', code: '2@x' },
      false
    );
    expect(mapped.qr).toBe('data:image/png;base64,abc');
    expect(mapped.available).toBe(true);
    expect(mapped.connected).toBe(false);
  });

  it('omite QR quando já conectado', () => {
    const mapped = mapEvolutionConnectToQr({ base64: 'data:image/png;base64,abc' }, true);
    expect(mapped.qr).toBeNull();
    expect(mapped.available).toBe(false);
    expect(mapped.connected).toBe(true);
  });

  it('marca open como conectado', () => {
    const mapped = mapEvolutionState('open', {
      ownerJid: '5511999999999@s.whatsapp.net',
      profileName: 'Atimo',
    });
    expect(mapped.connected).toBe(true);
    expect(mapped.qrAvailable).toBe(false);
    expect(mapped.info?.pushname).toBe('Atimo');
  });
});
