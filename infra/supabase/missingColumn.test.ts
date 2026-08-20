import { isMissingColumnError, stripMissingColumn } from './missingColumn';

describe('isMissingColumnError', () => {
  it('reconhece PGRST204 da coluna last_message', () => {
    expect(
      isMissingColumnError(
        {
          code: 'PGRST204',
          message: "Could not find the 'last_message' column of 'conversations' in the schema cache",
        },
        'last_message'
      )
    ).toBe(true);
  });

  it('ignora outro erro', () => {
    expect(isMissingColumnError({ code: '23505', message: 'duplicate' }, 'last_message')).toBe(false);
  });

  it('remove conversation_id do upsert quando a coluna não existe', () => {
    const next = stripMissingColumn(
      { id: 's1', conversation_id: '5511' },
      {
        code: 'PGRST204',
        message:
          "Could not find the 'conversation_id' column of 'scheduled_messages' in the schema cache",
      },
      ['conversation_id']
    );
    expect(next).toEqual({ id: 's1' });
  });

  it('remove keywords do upsert quando a coluna não existe', () => {
    const next = stripMissingColumn(
      { id: 'inicio', keywords: [] },
      {
        code: 'PGRST204',
        message: "Could not find the 'keywords' column of 'flows' in the schema cache",
      },
      ['keywords']
    );
    expect(next).toEqual({ id: 'inicio' });
  });
});
