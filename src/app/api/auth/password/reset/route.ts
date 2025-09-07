import db from "@/db/db";
import { passwordResetToken, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { AuthLogger } from "@/lib/auth/logger";
import { Logout } from "@/lib/auth/Logout";
import { constructHashedPassword } from "@/lib/auth/server.utils";
import { passwordSchema } from "@/lib/auth/shared.utils";
import { validatePasswordResetToken } from "@/lib/auth/token-validation";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password, tokenId, token } = await request.json();

    AuthLogger.logAttempt(
      "password_reset",
      "Password reset attempt",
      undefined,
      undefined,
      request,
      { tokenId }
    );

    if (!password || !tokenId || !token) {
      AuthLogger.logFailure(
        "password_reset_validation",
        "Missing required fields",
        undefined,
        undefined,
        request,
        { tokenId }
      );
      return NextResponse.json(
        { success: false, error: "Password, tokenId, and token are required" },
        { status: 400 }
      );
    }

    if (!passwordSchema.safeParse(password).success) {
      AuthLogger.logFailure(
        "password_reset_validation",
        "Invalid password format",
        undefined,
        undefined,
        request,
        { tokenId }
      );
      return NextResponse.json(
        { success: false, error: "Password is invalid" },
        { status: 400 }
      );
    }

    // Validate the token first
    const validation = await validatePasswordResetToken(tokenId, token);
    if (!validation.isValid) {
      AuthLogger.logFailure(
        "password_reset_token_validation",
        `Token validation failed: ${validation.error}`,
        undefined,
        undefined,
        request,
        { tokenId }
      );
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await constructHashedPassword(password);

    const result = await db.transaction(async (tx) => {
      // Get user's current reset nonce for increment
      const userData = await tx
        .select({ resetNonce: user.resetNonce })
        .from(user)
        .where(eq(user.id, validation.userId!))
        .then(([record]) => record);

      // Update password, increment reset nonce, and mark token as used
      await tx
        .update(user)
        .set({
          password: hashedPassword,
          resetNonce: (userData?.resetNonce || 0) + 1,
        })
        .where(eq(user.id, validation.userId!));

      // Mark token as used
      await tx
        .update(passwordResetToken)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetToken.id, tokenId));

      return { success: true };
    });

    // If the user is logged in, need to sign them out
    const isLoggedIn = await auth();
    if (!!isLoggedIn) {
      await Logout();
      AuthLogger.logSuccess(
        "password_reset_complete",
        "Password reset successful, user logged out",
        undefined,
        validation.userId,
        request,
        { tokenId }
      );
    } else {
      AuthLogger.logSuccess(
        "password_reset_complete",
        "Password reset successful",
        undefined,
        validation.userId,
        request,
        { tokenId }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to reset password";
    AuthLogger.logFailure(
      "password_reset_error",
      `Password reset failed: ${errorMessage}`,
      undefined,
      undefined,
      request
    );
    console.error("[Reset Password] Error:", error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
