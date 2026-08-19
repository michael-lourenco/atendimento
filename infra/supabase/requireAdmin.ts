import 'server-only';

import { NextResponse } from 'next/server';
import { isAdmin } from '@/core/entities/operatorRole';
import { User } from '@/core/entities/User';
import { apiJson } from '@/infra/http/apiJson';
import { getOperatorUser } from './getOperatorUser';

export async function requireAdminUser(
  request: Pick<Request, 'headers'>
): Promise<{ user: User } | { response: NextResponse }> {
  const user = await getOperatorUser();
  if (!user) {
    return { response: apiJson(request, { error: 'Não autenticado' }, { status: 401 }) };
  }
  if (!isAdmin(user)) {
    return { response: apiJson(request, { error: 'Só o admin' }, { status: 403 }) };
  }
  return { user };
}
