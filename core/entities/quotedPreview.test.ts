import { quotedPreview } from './quotedPreview';

describe('quotedPreview', () => {
  it('corta em 200', () => {
    expect(quotedPreview('  oi  ')).toBe('oi');
    expect(quotedPreview('a'.repeat(201)).length).toBe(200);
  });
});
