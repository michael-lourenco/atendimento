import { catalogPersistErrorMessage } from './catalog-persist-error';

describe('catalogPersistErrorMessage', () => {
  it('explica tabela ausente no PostgREST', () => {
    expect(catalogPersistErrorMessage({ code: 'PGRST205' }, 'quick_replies')).toContain(
      'quick_replies'
    );
  });

  it('usa a mensagem do Error', () => {
    expect(catalogPersistErrorMessage(new Error('falhou'), 'tags')).toBe('falhou');
  });

  it('explica FK de sessões ao excluir fluxo', () => {
    expect(catalogPersistErrorMessage({ code: '23503' }, 'flows')).toContain('015_flow_delete_cascade');
  });

  it('explica coluna keywords ausente no fluxo', () => {
    expect(
      catalogPersistErrorMessage(
        { code: 'PGRST204', message: "Could not find the 'keywords' column" },
        'flows'
      )
    ).toContain('017_flow_editor_session');
  });

  it('explica conversation_id ausente no agendamento', () => {
    expect(
      catalogPersistErrorMessage(
        { code: 'PGRST204', message: "Could not find the 'conversation_id' column" },
        'scheduled_messages'
      )
    ).toContain('010_schedule_conversation');
  });

  it('explica media_kind ausente nas respostas rápidas', () => {
    expect(
      catalogPersistErrorMessage(
        { code: 'PGRST204', message: "Could not find the 'media_kind' column" },
        'quick_replies'
      )
    ).toContain('022_quick_reply_audio');
  });

  it('explica department_id ausente nas respostas rápidas', () => {
    expect(
      catalogPersistErrorMessage(
        { code: 'PGRST204', message: "Could not find the 'department_id' column" },
        'quick_replies'
      )
    ).toContain('023_quick_reply_department');
  });

  it('usa a mensagem do objeto PostgREST', () => {
    expect(catalogPersistErrorMessage({ message: 'payload too large' }, 'flows')).toBe(
      'payload too large'
    );
  });
});
