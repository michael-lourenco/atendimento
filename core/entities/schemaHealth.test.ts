import { EXPECTED_SCHEMA_COLUMNS, schemaHealthReport, schemaHealthSql } from './schemaHealth';

describe('schemaHealth', () => {
  it('sql vazio se não houver issues', () => {
    expect(schemaHealthSql([])).toBe('');
    expect(schemaHealthReport([]).ok).toBe(true);
  });

  it('monta ALTER + notify', () => {
    const sql = schemaHealthSql([
      { table: 'messages', column: 'reactions', sqlType: 'jsonb' },
    ]);
    expect(sql).toContain('alter table public.messages add column if not exists reactions jsonb;');
    expect(sql).toContain("notify pgrst, 'reload schema';");
  });

  it('lista colunas esperadas incluindo quote e typing', () => {
    expect(EXPECTED_SCHEMA_COLUMNS.some((item) => item.column === 'quoted_message_id')).toBe(true);
    expect(EXPECTED_SCHEMA_COLUMNS.some((item) => item.column === 'contact_typing_at')).toBe(true);
    expect(
      EXPECTED_SCHEMA_COLUMNS.some(
        (item) => item.table === 'quick_replies' && item.column === 'department_id'
      )
    ).toBe(true);
    expect(
      EXPECTED_SCHEMA_COLUMNS.some((item) => item.table === 'chatbots' && item.column === 'behavior')
    ).toBe(true);
  });
});
