'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import { DashboardMetrics, Report } from '@/core/entities/Report';
import { reportToCsv, reportDownloadFilename, reportHistoryPeriod } from '@/core/entities/reportCsv';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Download } from 'lucide-react';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { CatalogSaveButton } from '@/ui/components/catalog-save-button';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { runCatalogSave } from '@/ui/lib/run-catalog-save';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { show, saving, kind, message, beginSave, markSaved, flashError } = useCatalogSavedFlash();

  const load = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [nextMetrics, nextReports] = await Promise.all([
        clientUseCases.dashboardMetrics().execute(),
        clientUseCases.reports().list(),
      ]);
      setMetrics(nextMetrics);
      setReports(nextReports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
  }, []);

  const handleGenerate = async () => {
    await runCatalogSave(
      async () => {
        await clientUseCases.generateReport().execute();
        await load();
      },
      { markSaved, flashError, beginSave },
      'reports'
    );
  };

  const handleDownload = (report: Report) => {
    const blob = new Blob([reportToCsv(report)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportDownloadFilename(report);
    link.click();
    URL.revokeObjectURL(url);
  };

  const typeLabel = (type: Report['type']) => {
    if (type === 'monthly') return 'Mensal';
    if (type === 'conversations') return 'Conversas';
    return 'Personalizado';
  };

  return (
    <div>
      <CatalogSavedNotice show={show} kind={kind} message={message} />
      <div className="mb-6">
        <p className="text-muted-foreground">
          Recorte: <strong>{reportHistoryPeriod()}</strong>. Não há filtro de datas nesta tela.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics?.totalMessages ?? '—'}</div>
            <p className="text-sm text-muted-foreground mt-2">Calculado a partir do histórico atual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {metrics?.activeConversations ?? '—'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Abertas ou aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxa de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {metrics ? `${metrics.responseRatePercent}%` : '—'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Outgoing / incoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tempo até Assumir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {metrics?.avgAssumeMinutes == null ? '—' : `${metrics.avgAssumeMinutes} min`}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Média do primeiro Assumir</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1ª resposta humana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {metrics?.avgFirstHumanReplyMinutes == null
                ? '—'
                : `${metrics.avgFirstHumanReplyMinutes} min`}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Média após o primeiro oi (sem o bot)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fila sem dono</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {metrics?.unassignedOlderThanMinutes ?? '—'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Abertas há 5 min ou mais, sem atendente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Volume por setor</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.conversationsByDepartment.length ? (
              <ul className="space-y-1 text-sm">
                {metrics.conversationsByDepartment.map((item) => (
                  <li key={item.name} className="flex justify-between gap-2">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sem conversas ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Relatórios Disponíveis</CardTitle>
              <CardDescription>
                Snapshot dos números acima. Não recorta por mês.
              </CardDescription>
            </div>
            <CatalogSaveButton
              type="button"
              flash={{ saving, show, kind, message }}
              onClick={handleGenerate}
            >
              Gerar snapshot do período atual
            </CatalogSaveButton>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CatalogListSkeleton rows={3} />
          ) : reports.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhum relatório encontrado</div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {typeLabel(report.type)} - {report.period}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
