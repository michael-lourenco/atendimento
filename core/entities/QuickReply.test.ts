import {
  QuickReply,
  quickRepliesForConversation,
  quickRepliesMatchingQuery,
  quickReplyIsValid,
  quickReplyListPreview,
  quickReplyPickerActionLabel,
  sortQuickReplies,
} from './QuickReply';

const at = new Date('2026-01-01');

function reply(partial: Partial<QuickReply> & Pick<QuickReply, 'id' | 'title'>): QuickReply {
  return { body: '', createdAt: at, ...partial };
}

describe('sortQuickReplies', () => {
  it('ordena pelo título', () => {
    const list: QuickReply[] = [
      { id: '2', title: 'Saudação', body: 'Olá', createdAt: at },
      { id: '1', title: 'Aguardar', body: 'Um momento', createdAt: at },
    ];
    expect(sortQuickReplies(list).map((item) => item.title)).toEqual(['Aguardar', 'Saudação']);
  });
});

describe('quickReplyListPreview', () => {
  it('mostra o rótulo da mídia quando não há texto', () => {
    expect(quickReplyListPreview(reply({ id: '1', title: 'Voicemail', mediaKind: 'audio' }))).toBe(
      'Áudio'
    );
    expect(quickReplyListPreview(reply({ id: '2', title: 'Foto', mediaKind: 'image' }))).toBe(
      'Foto'
    );
    expect(quickReplyListPreview(reply({ id: '3', title: 'Clip', mediaKind: 'video' }))).toBe(
      'Vídeo'
    );
    expect(quickReplyListPreview(reply({ id: '4', title: 'Tabela', mediaKind: 'document' }))).toBe(
      'Documento'
    );
  });
});

describe('quickReplyPickerActionLabel', () => {
  it('distingue mídia de texto', () => {
    expect(quickReplyPickerActionLabel({ mediaKind: 'audio' })).toBe('Envia áudio');
    expect(quickReplyPickerActionLabel({ mediaKind: 'image' })).toBe('Envia imagem');
    expect(quickReplyPickerActionLabel({ mediaKind: 'video' })).toBe('Envia vídeo');
    expect(quickReplyPickerActionLabel({ mediaKind: 'document' })).toBe('Envia documento');
    expect(quickReplyPickerActionLabel({ mediaKind: undefined })).toBe('Insere texto');
  });
});

describe('quickReplyIsValid', () => {
  it('aceita texto ou mídia', () => {
    expect(quickReplyIsValid({ title: 'Oi', body: 'Olá', mediaKind: undefined })).toBe(true);
    expect(quickReplyIsValid({ title: 'Oi', body: '', mediaKind: 'audio' })).toBe(true);
    expect(quickReplyIsValid({ title: 'Oi', body: '', mediaKind: 'image' })).toBe(true);
    expect(quickReplyIsValid({ title: 'Oi', body: '', mediaKind: 'video' })).toBe(true);
    expect(quickReplyIsValid({ title: 'Oi', body: '', mediaKind: 'document' })).toBe(true);
    expect(quickReplyIsValid({ title: 'Oi', body: '', mediaKind: undefined })).toBe(false);
    expect(quickReplyIsValid({ title: '  ', body: 'Olá', mediaKind: undefined })).toBe(false);
  });
});

describe('quickRepliesMatchingQuery', () => {
  const list = [
    reply({ id: '1', title: 'Saudação', body: 'Olá, equipe' }),
    reply({ id: '2', title: 'Aguardar', body: 'Um momento' }),
  ];

  it('sem termo devolve a lista', () => {
    expect(quickRepliesMatchingQuery(list, '  ').map((item) => item.id)).toEqual(['1', '2']);
  });

  it('casa título e texto sem distinguir maiúsculas', () => {
    expect(quickRepliesMatchingQuery(list, 'SAUDA').map((item) => item.id)).toEqual(['1']);
    expect(quickRepliesMatchingQuery(list, 'momento').map((item) => item.id)).toEqual(['2']);
  });
});

describe('quickRepliesForConversation', () => {
  const list = [
    reply({ id: 'g', title: 'Global', body: 'Oi' }),
    reply({ id: 'c', title: 'Comercial', body: 'Lead', departmentId: '1' }),
    reply({ id: 'd', title: 'Demo', body: 'Agenda', departmentId: '2' }),
  ];

  it('sem setor na conversa só mostra globais', () => {
    expect(quickRepliesForConversation(list).map((item) => item.id)).toEqual(['g']);
  });

  it('com setor mostra globais e as daquele setor', () => {
    expect(quickRepliesForConversation(list, '1').map((item) => item.id)).toEqual(['g', 'c']);
  });
});
