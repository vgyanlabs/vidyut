import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isOnboarded = token?.isOnboarded;

    // If user is not onboarded and trying to access protected routes
    if (!isOnboarded && !req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // If user is onboarded and trying to access onboarding
    if (isOnboarded && req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
}; 