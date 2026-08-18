import { pickWhatsAppDisplayName } from '../entities/pickWhatsAppDisplayName';

describe('pickWhatsAppDisplayName', () => {
  it('prefere nome e ignora o próprio número', () => {
    expect(pickWhatsAppDisplayName('5511999999999', '5511999999999', 'Ana')).toBe('Ana');
    expect(pickWhatsAppDisplayName('5511999999999')).toBe('5511999999999');
  });
});
