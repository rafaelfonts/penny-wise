import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip auth check for API routes, static files, and other non-page requests
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isStaticFile =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/favicon');

  // If it's an API route or static file, just pass through
  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Protected routes (excluding /chat which has client-side auth)
  const protectedPaths = ['/dashboard', '/profile', '/watchlist'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Auth paths
  const authPaths = ['/auth/login', '/auth/signup'];
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Only check auth for protected paths or auth paths
  if (isProtectedPath || isAuthPath) {
    try {
      // Trigger refresh if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Redirect to login if accessing protected route without auth
      if (isProtectedPath && !user) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect to dashboard if accessing auth pages while logged in
      if (isAuthPath && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Auth error in middleware:', error);
      // If auth fails, allow the request to continue for non-protected paths
      if (isProtectedPath) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // Special handling for /chat - allow access but let client-side handle auth
  if (request.nextUrl.pathname.startsWith('/chat')) {
    // Pass through to client-side auth handling
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff|woff2|ttf|eot)$).*)',
  ],
};
