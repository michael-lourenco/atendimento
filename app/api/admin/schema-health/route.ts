import { NextRequest } from 'next/server';
import { GetSchemaHealthUseCase } from '@/core/usecases/GetSchemaHealthUseCase';
import { schemaHealthReport } from '@/core/entities/schemaHealth';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { requireAdminUser } from '@/infra/supabase/requireAdmin';
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from '@/infra/supabase/serviceRoleClient';
import { probeSchemaColumn } from '@/infra/supabase/probeSchemaColumn';

export async function GET(request: NextRequest) {
  try {
    if (!isPublicSupabaseConfigured() || !isServiceRoleConfigured()) {
      return apiJson(request, schemaHealthReport([]), { status: 200 });
    }
    const gate = await requireAdminUser(request);
    if ('response' in gate) {
      return gate.response;
    }
    const client = createServiceRoleClient();
    const report = await new GetSchemaHealthUseCase().execute((table, column) =>
      probeSchemaColumn(client, table, column)
    );
    return apiJson(request, report, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao checar schema', error);
    return apiJson(request, schemaHealthReport([]), { status: 200 });
  }
}
