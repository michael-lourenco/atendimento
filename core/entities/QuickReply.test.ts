import { QuickReply, sortQuickReplies } from './QuickReply';

describe('sortQuickReplies', () => {
  it('ordena pelo título', () => {
    const list: QuickReply[] = [
      { id: '2', title: 'Saudação', body: 'Olá', createdAt: new Date('2026-01-01') },
      { id: '1', title: 'Aguardar', body: 'Um momento', createdAt: new Date('2026-01-01') },
    ];
    expect(sortQuickReplies(list).map((item) => item.title)).toEqual(['Aguardar', 'Saudação']);
  });
});
