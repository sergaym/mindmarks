import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  exp: number;
  token_type?: string;
  [key: string]: string | number | boolean | undefined;
}

// Middleware function to handle routing and authentication
export async function middleware(req: NextRequest) {
  // Get token from cookie - check both possible cookie names for compatibility
  const authCookie = req.cookies.get('auth_token')?.value || req.cookies.get('access_token')?.value;
  
  let isAuthenticated = false;
  let shouldRefresh = false;

  // Validate JWT token if present
  if (authCookie) {
    try {
      const decoded = jwtDecode<JwtPayload>(authCookie);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is still valid
      if (decoded.exp && decoded.exp > currentTime) {
        isAuthenticated = true;
        
        // Check if token expires within next 5 minutes (for proactive refresh)
        const fiveMinutesFromNow = currentTime + (5 * 60);
        if (decoded.exp < fiveMinutesFromNow) {
          shouldRefresh = true;
        }
      }
    } catch (error) {
      console.error('JWT validation error in middleware:', error);
      // Invalid token - clear the cookie
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      response.cookies.delete('access_token');
      return response;
    }
  }

  // Create response with security headers
  const res = NextResponse.next();
  
  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache control headers for authentication-related pages
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');

  // Add token refresh hint for client-side handling
  if (shouldRefresh) {
    res.headers.set('X-Auth-Refresh-Needed', 'true');
  }

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/settings', '/bookmarks', '/profile'];
  const isProtectedRoute = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedRoute && !isAuthenticated) {
    // Store the original URL for redirect after login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Prevent authenticated users from accessing auth pages
  const authPages = ['/login', '/register'];
  const isAuthPage = authPages.includes(req.nextUrl.pathname);
  
  if (isAuthenticated && isAuthPage) {
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl');
    const redirectUrl = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return res;
}

export const config = {
  matcher: [
    // Match all routes except for:
    // - API routes (they handle their own auth)
    // - Static files
    // - Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 