import { hasCronBearer } from './cronAuth';

describe('hasCronBearer', () => {
  it('aceita Bearer igual ao secret', () => {
    expect(hasCronBearer('Bearer abc-secret', 'abc-secret')).toBe(true);
  });

  it('recusa secret vazio', () => {
    expect(hasCronBearer('Bearer abc-secret', '')).toBe(false);
    expect(hasCronBearer('Bearer abc-secret', '   ')).toBe(false);
  });

  it('recusa token diferente', () => {
    expect(hasCronBearer('Bearer other', 'abc-secret')).toBe(false);
  });

  it('recusa header sem Bearer', () => {
    expect(hasCronBearer('abc-secret', 'abc-secret')).toBe(false);
  });
});
