import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
export const NO_AUTH_ROUTES = ["/"];

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  try {
    // Attempt to get the token from the request using NextAuth's getToken
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const path = req.nextUrl.pathname;
    // Check if the current path is in NO_AUTH_ROUTES
    const isPublicPath = NO_AUTH_ROUTES.includes(path);

    if (!isPublicPath && !token) {
      // User is not authenticated, redirect to the login page
      return NextResponse.redirect(new URL("/", req.url));
    }

    // User is authenticated, proceed with the request
    return NextResponse.next();
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error checking authentication:", error);

    // Optionally, redirect to an error page or handle the error as needed
    return NextResponse.redirect(new URL("/error", req.url));
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: ["/dashboard/:path*", "/login/:path*"],
};
