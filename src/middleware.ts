import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Get the pathname
    const path = request.nextUrl.pathname

    // Check if it's an admin path
    const isAdminPath = path.startsWith('/admin')

    // Get the token from cookies
    const token = request.cookies.get('admin_token')?.value

    // If it's an admin path and there's no token
    if (isAdminPath && !token) {
        // If it's already the admin login page, don't redirect
        if (path === '/admin') {
            return NextResponse.next()
        }
        // Redirect to admin login
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    // If it's the admin login page and user is already authenticated
    if (path === '/admin' && token) {
        // Redirect to admin dashboard
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    return NextResponse.next()
}

// Configure the paths that should be handled by this middleware
export const config = {
    matcher: '/admin/:path*'
} 