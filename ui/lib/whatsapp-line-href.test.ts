import { NUMBERS_CATALOG_HREF, whatsappConnectHref } from './whatsapp-line-href';

describe('whatsappConnectHref', () => {
  it('sem instância abre a tela de conexão', () => {
    expect(whatsappConnectHref()).toBe('/dashboard/whatsapp');
    expect(whatsappConnectHref('  ')).toBe('/dashboard/whatsapp');
  });

  it('com instância escolhe a linha', () => {
    expect(whatsappConnectHref('comercial')).toBe('/dashboard/whatsapp?instance=comercial');
  });

  it('cadastro continua em Números', () => {
    expect(NUMBERS_CATALOG_HREF).toBe('/dashboard/numbers');
  });
});
