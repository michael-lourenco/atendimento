import { isMissingColumnError } from './missingColumn';

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
});
