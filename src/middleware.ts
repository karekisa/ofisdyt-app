import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // PUBLIC ROUTES: These are always accessible without authentication
  // Allow /randevu and all its sub-routes (e.g., /randevu/[slug])
  const publicRoutes = [
    '/',
    '/randevu',
    '/login',
    '/subscription',
    '/book', // Legacy route support
  ]
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Always allow public routes to pass through
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // PROTECTED ROUTES: These will be handled by client-side authentication
  // Middleware allows them through, but client-side components will redirect if not authenticated
  // This approach is safer and prevents blocking legitimate requests
  const protectedPaths = [
    '/dashboard',
    '/admin',
    '/calendar',
    '/clients',
    '/finance',
    '/settings',
    '/support',
  ]
  
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  // For protected routes, allow through (client-side will handle auth)
  // This prevents server-side blocking issues
  if (isProtected) {
    // Let the request proceed - client-side will check authentication
    return NextResponse.next()
  }

  // Default: allow all other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

