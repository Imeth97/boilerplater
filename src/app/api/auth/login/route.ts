import db from "@/db/db";
import { account, user } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { AuthLogger } from "@/lib/auth/logger";
import { AuthResponse } from "@/lib/auth/typings/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password } = body;

    AuthLogger.logAttempt(
      "login_attempt",
      "User attempting login",
      email,
      undefined,
      request
    );

    // Validate required fields
    if (["", null, undefined].includes(email)) {
      AuthLogger.logFailure(
        "login_validation",
        "Email is required",
        email,
        undefined,
        request
      );
      return NextResponse.json(
        { success: false, error: "Email is required" } as AuthResponse,
        { status: 400 }
      );
    }

    if (["", null, undefined].includes(password)) {
      AuthLogger.logFailure(
        "login_validation",
        "Password is required",
        email,
        undefined,
        request
      );
      return NextResponse.json(
        { success: false, error: "Password is required" } as AuthResponse,
        { status: 400 }
      );
    }

    // check if the user had previously used this email via oauth
    const { provider, password: userPassword } = await db
      .select({
        provider: account.provider,
        password: user.password,
      })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email ?? ""))
      .then((result) => result[0] || { provider: null, password: null });

    // if there is a provider and no password, user previously signed in with oauth
    if (!!provider && !userPassword) {
      AuthLogger.logWarning(
        "oauth_account_clash",
        `User tried credentials login but account exists with ${provider}`,
        email,
        undefined,
        request,
        { provider }
      );
      return NextResponse.json(
        {
          success: false,
          redirect: `/login?provider=${provider}&email=${email}`,
        } as AuthResponse,
        { status: 409 }
      );
    }

    await signIn("credentials", {
      redirect: false,
      email: email ?? "",
      password: password ?? "",
    });

    AuthLogger.logSuccess(
      "login_success",
      "User successfully logged in",
      email,
      undefined,
      request
    );
    return NextResponse.json(
      { success: true, redirect: "/dashboard" } as AuthResponse,
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    AuthLogger.logFailure(
      "login_error",
      `Authentication failed: ${errorMessage}`,
      undefined,
      undefined,
      request
    );
    console.log(error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" } as AuthResponse,
      { status: 401 }
    );
  }
}
