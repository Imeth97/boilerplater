import { signOut } from "@/lib/auth";
import { AuthResponse } from "@/lib/auth/typings/auth";
import { AuthLogger } from "@/lib/auth/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { redirectTo } = body;

    AuthLogger.logAttempt(
      "logout_attempt",
      "User attempting logout",
      undefined,
      undefined,
      request
    );

    await signOut({
      redirect: false,
    });

    const redirectUrl = redirectTo || "/";
    AuthLogger.logSuccess(
      "logout_success",
      `User logged out successfully, redirect to ${redirectUrl}`,
      undefined,
      undefined,
      request,
      { redirectTo: redirectUrl }
    );
    return NextResponse.json(
      { success: true, redirect: redirectUrl } as AuthResponse,
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    AuthLogger.logFailure(
      "logout_error",
      `Logout failed: ${errorMessage}`,
      undefined,
      undefined,
      request
    );
    console.log(error);
    return NextResponse.json(
      { success: false, error: "Logout failed" } as AuthResponse,
      { status: 500 }
    );
  }
}
