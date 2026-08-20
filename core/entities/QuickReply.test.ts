import { QuickReply, quickReplyIsValid, quickReplyListPreview, sortQuickReplies } from './QuickReply';

describe('sortQuickReplies', () => {
  it('ordena pelo título', () => {
    const list: QuickReply[] = [
      { id: '2', title: 'Saudação', body: 'Olá', createdAt: new Date('2026-01-01') },
      { id: '1', title: 'Aguardar', body: 'Um momento', createdAt: new Date('2026-01-01') },
    ];
    expect(sortQuickReplies(list).map((item) => item.title)).toEqual(['Aguardar', 'Saudação']);
  });
});

describe('quickReplyListPreview', () => {
  it('mostra Áudio quando não há texto', () => {
    expect(
      quickReplyListPreview({
        id: '1',
        title: 'Voicemail',
        body: '',
        mediaKind: 'audio',
        createdAt: new Date('2026-01-01'),
      })
    ).toBe('Áudio');
  });
});

describe('quickReplyIsValid', () => {
  it('aceita texto ou áudio', () => {
    expect(quickReplyIsValid({ title: 'Oi', body: 'Olá', mediaKind: undefined })).toBe(true);
    expect(quickReplyIsValid({ title: 'Oi', body: '', mediaKind: 'audio' })).toBe(true);
    expect(quickReplyIsValid({ title: 'Oi', body: '', mediaKind: undefined })).toBe(false);
    expect(quickReplyIsValid({ title: '  ', body: 'Olá', mediaKind: undefined })).toBe(false);
  });
});
