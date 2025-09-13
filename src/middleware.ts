// Authentication middleware for Next.js
// Protects routes and redirects unauthenticated users

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/'];

// Define admin-only routes
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Check if the route requires admin access
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  // Get the authentication token from cookies
  // Note: In a real implementation, you would verify the JWT token here
  const authToken = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;
  
  // If accessing a protected route without authentication
  if (!isPublicRoute && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If accessing an admin route without admin role
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/resources', request.url));
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// Extension points for future middleware features:
// - JWT token verification
// - Rate limiting
// - Security headers
// - Request logging
// - A/B testing
// - Feature flags
// - IP-based restrictions