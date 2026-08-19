import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { REQUEST_ID_HEADER, requestIdFrom } from '@/infra/http/requestId';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

function nextWithRequestId(request: NextRequest, requestId: string) {
  const headers = new Headers(request.headers);
  headers.set(REQUEST_ID_HEADER, requestId);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

function skipSupabaseSession(path: string): boolean {
  return (
    path.startsWith('/api/webhook') ||
    path.startsWith('/api/schedules') ||
    path.startsWith('/api/chat-whatsapp')
  );
}

export async function middleware(request: NextRequest) {
  const requestId = requestIdFrom(request);
  const path = request.nextUrl.pathname;

  if (!isPublicSupabaseConfigured() || skipSupabaseSession(path)) {
    return nextWithRequestId(request, requestId);
  }

  let supabaseResponse = nextWithRequestId(request, requestId);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = nextWithRequestId(request, requestId);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && path.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirect = NextResponse.redirect(url);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return copyCookies(supabaseResponse, redirect);
  }

  if (user && path === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard/conversations';
    const redirect = NextResponse.redirect(url);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return copyCookies(supabaseResponse, redirect);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/api/:path*'],
};
