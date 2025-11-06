import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/utils';

// Define role hierarchy for easier checking
const roleHierarchy = {
  admin: ['admin', 'hr', 'employee'],
  hr: ['hr', 'employee'],
  employee: ['employee'],
};

function isAuthorized(userRole: 'admin' | 'hr' | 'employee', requiredRoles: string[]): boolean {
  const allowedRoles = roleHierarchy[userRole] || [];
  return requiredRoles.some(role => allowedRoles.includes(role));
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/register', '/unauthorized'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Redirect root to login if not authenticated, or dashboard if authenticated
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      await verifyToken(token);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decoded: { userId: string; role: 'admin' | 'hr' | 'employee' } = await verifyToken(token);
    const userRole = decoded.role;
    
    // Add user details to request headers for use in server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-role', userRole);

    if (pathname.startsWith('/admin') && !isAuthorized(userRole, ['admin'])) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/hr') && !isAuthorized(userRole, ['admin', 'hr'])) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // Employee dashboard is accessible to all authenticated users
    if (pathname.startsWith('/employee') && !isAuthorized(userRole, ['admin', 'hr', 'employee'])) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // General dashboard accessible to all authenticated users
    if (pathname.startsWith('/dashboard') && !isAuthorized(userRole, ['admin', 'hr', 'employee'])) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

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
