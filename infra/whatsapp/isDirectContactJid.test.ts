import { isDirectContactJid } from './isDirectContactJid';

describe('isDirectContactJid', () => {
  it('aceita pessoa', () => {
    expect(isDirectContactJid('5511999999999@s.whatsapp.net')).toBe(true);
    expect(isDirectContactJid('5511999999999@c.us')).toBe(true);
    expect(isDirectContactJid('1234567890@lid')).toBe(true);
    expect(isDirectContactJid('5511999999999')).toBe(true);
  });

  it('rejeita grupo, broadcast e canal', () => {
    expect(isDirectContactJid('120363021234567890@g.us')).toBe(false);
    expect(isDirectContactJid('status@broadcast')).toBe(false);
    expect(isDirectContactJid('1203630@newsletter')).toBe(false);
    expect(isDirectContactJid('')).toBe(false);
  });
});
