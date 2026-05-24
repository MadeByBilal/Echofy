import { NextResponse } from 'next/server'

// protected routes — must be logged in
// Temporarily removed '/setup' so newly-registered users can access it without the auth cookie
const protectedRoutes = ['/chat', '/friends']

// auth routes — if logged in, can't go back here
const authRoutes = ['/login', '/register']

export async function middleware(request) {
  const token = request.cookies.get('token')?.value
  const path = request.nextUrl.pathname

  // if trying to access protected route without token
  if (protectedRoutes.some(route => path.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // if already logged in, can't go to login/register
  if (authRoutes.some(route => path.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/chat', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}