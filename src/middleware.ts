import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    if (token?.mustChangePassword) {
      return NextResponse.redirect(new URL('/cambiar-password', req.url));
    }

    if (req.nextUrl.pathname.startsWith('/admin') && token?.role === 'vendedor') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: '/login' },
  }
);

export const config = {
  matcher: [
    '/((?!login|recuperar-password|reset-password|cambiar-password|api/auth|_next/static|_next/image|favicon.ico|LogoSS.png|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
