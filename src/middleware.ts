import { isUserAuthenticated } from "@/components/auth/utils";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
export const NO_AUTH_ROUTES = ["/"];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Check if the current path is in NO_AUTH_ROUTES
  const isPublicPath = NO_AUTH_ROUTES.includes(path);

  const isAuthenticated = await isUserAuthenticated();

  // If the path requires authentication and user is not authenticated
  if (!isPublicPath && !isAuthenticated) {
    // Redirect to home page
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Continue with the request if authentication check passes
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ["/dashboard/:path*", "/login/:path*"],
};
