// Email confirmation route
import db from "@/db/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { AuthLogger } from "@/lib/auth/logger";
import { nullToUndefined } from "@/lib/type-utils";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req) {
  AuthLogger.logAttempt(
    "email_confirmation",
    "Email confirmation attempt",
    undefined,
    undefined,
    req
  );

  if (!req.auth) {
    AuthLogger.logFailure(
      "email_confirmation",
      "Unauthorized request - no auth context",
      undefined,
      undefined,
      req
    );
    console.error("[Auth Confirmation] Unauthorized request - no auth context");
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    AuthLogger.logFailure(
      "email_confirmation",
      "Missing confirmation token in URL params",
      undefined,
      undefined,
      req
    );
    console.error(
      "[Auth Confirmation] Missing confirmation token in URL params"
    );
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET!);
    const { userId } = decoded as { userId: string };
    const validatedUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .then((rows) => rows[0]);
    if (!validatedUser) {
      AuthLogger.logFailure(
        "email_confirmation",
        "User not found for token",
        undefined,
        userId,
        req
      );
      console.error(`[Auth Confirmation] User not found for ID: ${userId}`);
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    // ensure email is not already verified
    if (!!validatedUser.emailVerified) {
      AuthLogger.logWarning(
        "email_confirmation",
        "Email already verified",
        nullToUndefined(validatedUser.email),
        userId,
        req
      );
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    // set emailVerified to current date
    await db
      .update(user)
      .set({ emailVerified: new Date() })
      .where(eq(user.id, userId));

    AuthLogger.logSuccess(
      "email_confirmation",
      "Email successfully confirmed",
      nullToUndefined(validatedUser.email),
      userId,
      req
    );
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    AuthLogger.logFailure(
      "email_confirmation",
      `Token verification failed: ${errorMessage}`,
      undefined,
      undefined,
      req
    );
    console.error("[Auth Confirmation] Token verification failed:", error);
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});
