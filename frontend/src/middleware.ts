import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware function to handle routing and authentication
export async function middleware(req: NextRequest) {
  // Get token from cookie - tokens stored in localStorage aren't accessible in middleware
  // Therefore we need to use cookies for server-side auth checks
  const authCookie = req.cookies.get('auth_token')?.value;
  const isAuthenticated = !!authCookie;

  // Adding Cache-Control headers to avoid caching middleware responses
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');

  // Protected routes that require authentication
  if (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/settings') ||
    req.nextUrl.pathname.startsWith('/bookmarks')
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Prevent authenticated users from accessing login/register pages
  if (
    isAuthenticated && 
    (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    // Match all routes except for:
    // - static files (images, assets, favicon, etc)
    // - api routes that handle their own auth
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 