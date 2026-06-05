import { NextResponse } from "next/server";

// Auth is handled client-side by ProtectedRoute and auth page guards.
// Middleware only handles non-auth concerns (headers, redirects, etc.).
export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
