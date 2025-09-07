import db from "@/db/db";
import { account, user } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { passwordSchema } from "@/lib/auth/shared.utils";
import {
  constructConfirmationUrl,
  constructHashedPassword,
} from "@/lib/auth/test-utils";
import { AuthResponse } from "@/lib/auth/typings/auth";
import { AuthLogger } from "@/lib/auth/logger";
import { sendMail } from "@/lib/email/sendEmail";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    AuthLogger.logAttempt("signup_attempt", "User attempting signup", email, undefined, request);

    // Validate required fields
    if (["", null, undefined].includes(email)) {
      AuthLogger.logFailure("signup_validation", "Email is required", email, undefined, request);
      return NextResponse.json(
        { success: false, error: "Email is required" } as AuthResponse,
        { status: 400 }
      );
    }

    if (!passwordSchema.safeParse(password).success) {
      AuthLogger.logFailure("signup_validation", "Password is invalid", email, undefined, request);
      return NextResponse.json(
        { success: false, error: "Password is invalid" } as AuthResponse,
        { status: 400 }
      );
    }

    // Check if user already exists and what providers they used
    const { provider, password: userPassword } = await db
      .select({
        provider: account.provider,
        password: user.password,
      })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email ?? ""))
      .then((result) => result[0] || { provider: null, password: null });

    if (userPassword || provider) {
      // User already exists
      if (provider && !userPassword) {
        // User exists with OAuth only - redirect to login with provider hint
        AuthLogger.logWarning("oauth_signup_conflict", `User tried to signup but OAuth account exists with ${provider}`, email, undefined, request, { provider });
        return NextResponse.json(
          {
            success: false,
            redirect: `/login?provider=${provider}&email=${email}`,
          } as AuthResponse,
          { status: 409 }
        );
      }
      // User exists with credentials (or both) - regular conflict
      AuthLogger.logFailure("signup_user_exists", "User already exists with credentials", email, undefined, request);
      return NextResponse.json(
        { success: false, error: "User already exists" } as AuthResponse,
        { status: 409 }
      );
    }

    // Create new user
    const hashedPassword = await constructHashedPassword(password);
    const addedUser = await db
      .insert(user)
      .values({
        email,
        password: hashedPassword,
        name: username,
      })
      .returning()
      .then(([user]) => user);

    if (!addedUser) {
      AuthLogger.logFailure("user_creation", "Failed to create user in database", email, undefined, request);
      return NextResponse.json(
        { success: false, error: "Failed to create user" } as AuthResponse,
        { status: 500 }
      );
    }

    AuthLogger.logSuccess("user_created", "User successfully created", email, addedUser.id, request, { username });

    // Send confirmation email
    const confirmationUrl = constructConfirmationUrl(addedUser.id);
    const mailSent = await sendMail({
      sendTo: email,
      subject: "Welcome to our app",
      text: "Welcome to our app",
      html: `<p>Please click <a href="${confirmationUrl}">here</a> to confirm your email.</p>`,
    });

    if (!mailSent) {
      AuthLogger.logFailure("email_send", "Failed to send confirmation email", email, addedUser.id, request);
      return NextResponse.json(
        { success: false, error: "Failed to send email" } as AuthResponse,
        { status: 500 }
      );
    }

    AuthLogger.logSuccess("email_sent", "Confirmation email sent successfully", email, addedUser.id, request);

    // Sign in the user via login API
    try {
      await signIn("credentials", {
        redirect: false,
        email: email ?? "",
        password: password ?? "",
      });

      AuthLogger.logSuccess("signup_complete", "User signup and auto-signin successful", email, addedUser.id, request);
      return NextResponse.json(
        { success: true, redirect: "/dashboard" } as AuthResponse,
        { status: 200 }
      );
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : "Unknown auth error";
      AuthLogger.logFailure("signup_signin", `Failed to auto-signin after signup: ${errorMessage}`, email, addedUser.id, request);
      console.error("Auth error during signup:", authError);
      return NextResponse.json(
        { success: false, error: "Failed to sign in" } as AuthResponse,
        { status: 401 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    AuthLogger.logFailure("signup_error", `Signup process failed: ${errorMessage}`, undefined, undefined, request);
    console.error("Error during signup:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } as AuthResponse,
      { status: 500 }
    );
  }
}
