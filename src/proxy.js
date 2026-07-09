import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function proxy(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    const adminPaths = ['/admin'];
    const authPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];
    const protectedPaths = ['/orders', '/checkout', '/profile'];

    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));
    const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
    const isProtectedPath = protectedPaths.some((path) =>
        pathname.startsWith(path)
    );

    // verify token once
    let user = null;
    if (token) {
        try {
            user = verifyToken(token);
        } catch {
            user = null;
        }
    }

    // 1 — Protect /admin — must be admin or sub-admin
    if (isAdminPath) {
        if (!user) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
        if (!['admin', 'sub-admin'].includes(user.role)) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // 2 — Protect customer routes — must be logged in
    if (isProtectedPath) {
        if (!user) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }
        return NextResponse.next();
    }

    // 3 — Redirect logged-in users away from auth pages
    if (isAuthPath && user) {
        if (['admin', 'sub-admin'].includes(user.role)) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/orders/:path*',
        '/checkout/:path*',
        '/profile/:path*',
        '/auth/:path*',
    ],
};
