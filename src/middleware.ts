import { NextResponse } from "next/server";

export async function middleware() {
  // Middleware can be used for other purposes like CORS, logging, etc.
  // Route protection is now handled by WithRouteProtection HOC
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
