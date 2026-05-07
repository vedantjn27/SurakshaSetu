import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname === '/branding' || pathname === '/login' || pathname === '/') {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/ubid') || 
      pathname.startsWith('/upload') || pathname.startsWith('/review') ||
      pathname.startsWith('/audit') || pathname.startsWith('/privacy')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|public).*)'],
};
