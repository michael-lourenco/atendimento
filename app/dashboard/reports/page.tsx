'use client';

import { useEffect, useState } from 'react';
import { DashboardMetrics, Report } from '@/core/entities/Report';
import { GetDashboardMetricsUseCase } from '@/core/usecases/GetDashboardMetricsUseCase';
import { ReportCatalogUseCase } from '@/core/usecases/ReportCatalogUseCase';
import { GenerateReportUseCase } from '@/core/usecases/GenerateReportUseCase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Download, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  const load = async () => {
    const [nextMetrics, nextReports] = await Promise.all([
      new GetDashboardMetricsUseCase().execute(),
      new ReportCatalogUseCase().list(),
    ]);
    setMetrics(nextMetrics);
    setReports(nextReports);
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    await new GenerateReportUseCase().execute();
    load();
  };

  const handleDownload = (report: Report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.id}.json`;
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
      <div className="mb-6">
        <p className="text-muted-foreground">Volume e análises a partir do histórico atual</p>
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
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Relatórios Disponíveis</CardTitle>
              <CardDescription>Visualize e baixe relatórios gerados</CardDescription>
            </div>
            <Button onClick={handleGenerate}>
              <Calendar className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum relatório encontrado</div>
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
