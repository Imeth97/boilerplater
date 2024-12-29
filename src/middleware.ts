import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkAuth } from "./components/auth/utils";

// Routes that don't require authentication
export const NO_AUTH_ROUTES = ["/", "/login", "/reset-password"];

export async function middleware(req: NextRequest) {
  // Attempt to get the token from the request using NextAuth's getToken
  const session = await checkAuth();
  const path = req.nextUrl.pathname;
  // Check if the current path is in NO_AUTH_ROUTES
  const isPublicPath = NO_AUTH_ROUTES.includes(path);

  if (!isPublicPath && !session) {
    // User is not authenticated, redirect to the login page
    return NextResponse.redirect(new URL("/", req.url));
  }

  // User is authenticated, proceed with the request
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ["/dashboard/:path*", "/login/:path*"],
};
