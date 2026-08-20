import { NextRequest } from 'next/server';
import { CreateOperatorError } from '@/core/usecases/CreateOperatorUseCase';
import { LoginDeniedError } from '@/core/entities/loginDenied';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';

export function operatorUseCaseResponse(
  request: NextRequest,
  error: unknown,
  fallback: string
): Response {
  if (error instanceof CreateOperatorError) {
    return apiJson(request, { error: error.message }, { status: error.status });
  }
  if (error instanceof LoginDeniedError) {
    return apiJson(request, { error: error.message }, { status: 403 });
  }
  logApiError(requestIdFrom(request), fallback, error);
  return apiJson(request, { error: fallback }, { status: 500 });
}
