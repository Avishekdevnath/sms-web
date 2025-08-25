import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/auth';

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': ['admin', 'developer', 'manager', 'sre', 'mentor', 'student'],
  '/dashboard/admin': ['admin'],
  '/dashboard/developer': ['developer'],
  '/dashboard/manager': ['manager'],
  '/dashboard/sre': ['sre'],
  '/dashboard/mentor': ['mentor'],
  '/dashboard/student': ['student'],
  '/mission-hub': ['admin', 'developer', 'manager', 'sre'],
  '/api/students': ['admin', 'manager', 'developer', 'sre'],
  '/api/batches': ['admin', 'manager'],
  '/api/courses': ['admin', 'manager'],
  '/api/assignments': ['admin', 'manager', 'mentor'],
  '/api/exams': ['admin', 'manager', 'mentor'],
  '/api/missions': ['admin', 'manager', 'sre'],
  '/api/attendance': ['admin', 'manager', 'mentor'],
  '/api/notices': ['admin', 'manager'],
  '/api/call-logs': ['admin', 'sre'],
};

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/forgot-password',
  '/api/auth/clear-token',
  '/api/auth/verify',
  '/api/auth/me',
  '/api/health',
  '/api/debug-env',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if it's a protected route
  const protectedRoute = Object.keys(protectedRoutes).find(route => 
    pathname.startsWith(route)
  );

  if (!protectedRoute) {
    // If not explicitly protected, allow access (for static assets, etc.)
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify the token
    const user = verifyUserToken(token);
    
    // Check if user object and required properties exist
    if (!user) {
      throw new Error('Token verification failed - no user returned');
    }
    
    if (!user._id || !user.role) {
      throw new Error('Invalid token structure - missing required properties');
    }

    // Check if user has required role for this route
    const requiredRoles = protectedRoutes[protectedRoute];
    if (!requiredRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      const dashboardUrl = new URL(`/dashboard/${user.role}`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user._id.toString());
      requestHeaders.set('x-user-role', user.role);
      requestHeaders.set('x-user-email', user.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware authentication error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      pathname,
      hasToken: !!token
    });
    
    // Clear invalid token and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 