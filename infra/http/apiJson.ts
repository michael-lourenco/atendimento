import { NextResponse } from 'next/server';
import { REQUEST_ID_HEADER, requestIdFrom } from './requestId';

export function applyRequestId<T extends Response>(request: Pick<Request, 'headers'>, response: T): T {
  response.headers.set(REQUEST_ID_HEADER, requestIdFrom(request));
  return response;
}

export function apiJson(request: Pick<Request, 'headers'>, data: unknown, init?: ResponseInit): NextResponse {
  return applyRequestId(request, NextResponse.json(data, init));
}
