import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function runs BEFORE any page is rendered
export function middleware(request: NextRequest) {
  // 1. Check if the user has our secure auth cookie
  const token = request.cookies.get('agronxt_token')?.value;

  // 2. Define which routes are strictly protected
  const protectedPaths = [
    '/dashboard', 
    '/tools', 
    '/community', 
    '/account', 
    '/network'
  ];
  
  // 3. Define routes that logged-in users shouldn't see
  const authPaths = ['/login', '/register', '/forgot-password'];

  const currentPath = request.nextUrl.pathname;

  // Check if they are trying to access a protected route
  const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path));

  // IF NOT LOGGED IN & TRYING TO ACCESS DASHBOARD -> KICK TO LOGIN
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if they are trying to access login/register
  const isAuthPath = authPaths.some(path => currentPath.startsWith(path));

  // IF ALREADY LOGGED IN & TRYING TO ACCESS LOGIN -> PUSH TO DASHBOARD
  if (isAuthPath && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If everything is fine, let them proceed
  return NextResponse.next();
}

// 4. Configure the Bouncer: Tell Next.js which routes to run this on
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/tools/:path*', 
    '/community/:path*', 
    '/account/:path*', 
    '/network/:path*',
    '/login', 
    '/register', 
    '/forgot-password'
  ],
};