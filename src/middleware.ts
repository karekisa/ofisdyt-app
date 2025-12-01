import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Public booking pages don't require auth - handled client-side
  if (req.nextUrl.pathname.startsWith('/book/')) {
    return NextResponse.next()
  }

  // Allow auth pages
  if (req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // All other routes will be protected client-side
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

