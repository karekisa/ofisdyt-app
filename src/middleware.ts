import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/book/', '/login', '/subscription']
  
  // Check if the pathname starts with any public route
  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // All other routes will be protected client-side
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

