import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { loggers } from '@/lib/utils/logger';

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Rate limiting store (in-memory for demo)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

function checkRateLimit(
  ip: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  // Skip auth check for API routes, static files, and other non-page requests
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isStaticFile =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/favicon');

  // Get client IP for rate limiting
  const clientIP = getClientIP(request);

  // Apply rate limiting to API routes
  if (isApiRoute) {
    const limit = request.nextUrl.pathname.startsWith('/api/chat/') ? 60 : 100;

    if (!checkRateLimit(clientIP, limit)) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // If it's an API route or static file, apply security headers and pass through
  if (isApiRoute || isStaticFile) {
    const response = NextResponse.next();

    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    if (isApiRoute) {
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('X-API-Version', '1.0');
    }

    return response;
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
      loggers.middleware.error('Auth error in middleware', error);
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
    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

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
