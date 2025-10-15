import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/optimail', '/optishop', '/optihire', '/optitrip'];
const AUTH_USERNAME = 'optigence';
const AUTH_PASSWORD = 'creaiopt8585';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    url.pathname.startsWith(route)
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // Check for basic authentication
  const basicAuth = request.headers.get('authorization');
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, password] = atob(authValue).split(':');
    
    if (user === AUTH_USERNAME && password === AUTH_PASSWORD) {
      return NextResponse.next();
    }
  }
  
  // Return 401 with WWW-Authenticate header
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Optigence Modules"',
    },
  });
}

export const config = {
  matcher: [
    '/optimail/:path*',
    '/optishop/:path*', 
    '/optihire/:path*',
    '/optitrip/:path*',
  ],
};
