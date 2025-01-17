import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const checkAuth = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/check-auth`,
      {
        method: "GET",
        headers: headers(),
      }
    );
    const data = await response.json();
    return !!data.authenticated;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

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
