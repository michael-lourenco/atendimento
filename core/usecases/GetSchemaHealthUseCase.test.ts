import { GetSchemaHealthUseCase } from './GetSchemaHealthUseCase';

describe('GetSchemaHealthUseCase', () => {
  it('marca coluna ausente', async () => {
    const report = await new GetSchemaHealthUseCase().execute(async (table, column) => {
      return !(table === 'messages' && column === 'reactions');
    });
    expect(report.ok).toBe(false);
    expect(report.issues.some((item) => item.column === 'reactions')).toBe(true);
    expect(report.sql).toContain('messages');
  });

  it('ok quando o probe confirma tudo', async () => {
    const report = await new GetSchemaHealthUseCase().execute(async () => true);
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
  });
});
