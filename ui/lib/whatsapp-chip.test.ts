import { connectedCatalogCount, whatsappChipState } from './whatsapp-chip';

describe('whatsappChipState', () => {
  it('uma linha usa conectado/desconectado', () => {
    expect(whatsappChipState({ catalogCount: 1, connectedCount: 1, anyConnected: true })).toEqual({
      tone: 'ok',
      label: 'WhatsApp conectado',
      compact: 'On',
    });
    expect(whatsappChipState({ catalogCount: 0, connectedCount: 0, anyConnected: false })).toEqual({
      tone: 'down',
      label: 'WhatsApp desconectado',
      compact: 'Off',
    });
  });

  it('várias linhas usam N de M e vermelho se alguma caiu', () => {
    expect(whatsappChipState({ catalogCount: 3, connectedCount: 3, anyConnected: true })).toEqual({
      tone: 'ok',
      label: '3 de 3 linhas',
      compact: '3/3',
    });
    expect(whatsappChipState({ catalogCount: 3, connectedCount: 2, anyConnected: true })).toEqual({
      tone: 'down',
      label: '2 de 3 linhas',
      compact: '2/3',
    });
  });
});

describe('connectedCatalogCount', () => {
  it('conta linhas do catálogo com instância aberta', () => {
    expect(
      connectedCatalogCount(['comercial', 'suporte'], [
        { name: 'comercial', connected: true },
        { name: 'suporte', connected: false },
      ])
    ).toBe(1);
  });
});
