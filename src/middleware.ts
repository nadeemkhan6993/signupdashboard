import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Expert-only routes (require expertToken)
    const expertOnlyPaths = ['/expert/write-blog', '/expert/profile']
    
    // Expert auth pages (redirect to dashboard if already logged in)
    const expertAuthPaths = ['/expert/login', '/expert/signup']

    const expertToken = request.cookies.get("expertToken")?.value || ""

    // If trying to access expert-only paths without token
    if (expertOnlyPaths.some(p => path.startsWith(p)) && !expertToken) {
        return NextResponse.redirect(new URL('/expert/login', request.url))
    }

    // If logged in expert tries to access auth pages
    if (expertAuthPaths.includes(path) && expertToken) {
        return NextResponse.redirect(new URL('/', request.url))
    }
}
 
export const config = {
    matcher: ['/expert/:path*'],
}