import { isQuickReplyPickerOpenKey } from './quick-reply-picker-keys';

const slash = { key: '/', ctrlKey: false, metaKey: false, altKey: false };

describe('isQuickReplyPickerOpenKey', () => {
  it('abre com / no campo vazio', () => {
    expect(isQuickReplyPickerOpenKey(slash, '')).toBe(true);
    expect(isQuickReplyPickerOpenKey(slash, 'oi')).toBe(false);
  });

  it('abre com Ctrl ou Meta + / mesmo com texto', () => {
    expect(isQuickReplyPickerOpenKey({ ...slash, ctrlKey: true }, 'oi')).toBe(true);
    expect(isQuickReplyPickerOpenKey({ ...slash, metaKey: true }, 'oi')).toBe(true);
  });

  it('ignora Alt+/', () => {
    expect(isQuickReplyPickerOpenKey({ ...slash, altKey: true }, '')).toBe(false);
  });
});
