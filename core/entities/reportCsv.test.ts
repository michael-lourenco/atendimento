import { Report } from './Report';
import { reportDownloadFilename, reportToCsv } from './reportCsv';

describe('reportToCsv', () => {
  it('gera colunas em português', () => {
    const report: Report = {
      id: 'r1',
      title: 'Agosto "A"',
      type: 'conversations',
      period: '2026-08',
      createdAt: new Date('2026-08-19T12:00:00.000Z'),
    };
    const csv = reportToCsv(report);
    expect(csv.startsWith('titulo,tipo,periodo,gerado_em\n')).toBe(true);
    expect(csv).toContain('"Agosto ""A"""');
    expect(csv).toContain('"Conversas"');
    expect(csv).toContain('"2026-08"');
  });

  it('nome do arquivo usa tipo e data', () => {
    const report: Report = {
      id: 'report-1',
      title: 'X',
      type: 'conversations',
      period: 'Atual',
      createdAt: new Date('2026-08-19T12:00:00.000Z'),
    };
    expect(reportDownloadFilename(report)).toBe('relatorio-conversations-2026-08-19.csv');
  });
});
