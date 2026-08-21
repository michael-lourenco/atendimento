import { Report } from './Report';

const TYPE_LABEL: Record<Report['type'], string> = {
  monthly: 'Mensal',
  conversations: 'Conversas',
  custom: 'Personalizado',
};

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function reportToCsv(report: Report): string {
  const created =
    report.createdAt instanceof Date
      ? report.createdAt.toISOString()
      : String(report.createdAt);
  const header = ['titulo', 'tipo', 'periodo', 'gerado_em'].join(',');
  const row = [
    csvCell(report.title),
    csvCell(TYPE_LABEL[report.type]),
    csvCell(report.period),
    csvCell(created),
  ].join(',');
  return `${header}\n${row}\n`;
}

export function reportHistoryPeriod(now = new Date()): string {
  return `Todo o histórico até ${now.toLocaleDateString('pt-BR')}`;
}

export function reportDownloadFilename(report: Report): string {
  const day =
    report.createdAt instanceof Date
      ? report.createdAt.toISOString().slice(0, 10)
      : String(report.createdAt).slice(0, 10);
  return `relatorio-${report.type}-${day}.csv`;
}
