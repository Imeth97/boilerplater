import db from "@/db/db";
import { passwordResetToken, user } from "@/db/schema";
import { AuthLogger } from "@/lib/auth/logger";
import { sendMail } from "@/lib/email/sendEmail";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    AuthLogger.logAttempt(
      "password_reset_request",
      "Password reset request",
      email,
      undefined,
      request
    );

    if (!email) {
      AuthLogger.logFailure(
        "password_reset_validation",
        "Email is required",
        email,
        undefined,
        request
      );
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const userToReset = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .then(([user]) => user);

    if (!userToReset) {
      AuthLogger.logFailure(
        "password_reset_user_not_found",
        "User not found for password reset",
        email,
        undefined,
        request
      );
      console.error(`[Request Reset] User not found for email: ${email}`);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate a new random token
    const plainToken = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(plainToken, 10);

    const newToken = await db.transaction(async (tx) => {
      // Invalidate any existing unused tokens for this user
      await tx
        .update(passwordResetToken)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetToken.userId, userToReset.id));

      // Create new reset token
      const [newToken] = await tx
        .insert(passwordResetToken)
        .values({
          userId: userToReset.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        })
        .returning();

      return newToken;
    });

    if (!newToken) {
      throw new Error("Failed to create password reset token");
    }

    // Construct reset URL with token ID and plain token
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const resetPasswordUrl = `${baseUrl}/reset-password?tokenId=${newToken.id}&token=${plainToken}`;

    // Send email
    const mailSent = await sendMail({
      sendTo: email,
      subject: "Reset your password",
      text: "Reset your password. Do not share this link with anyone.",
      html: `<p>Please click <a href="${resetPasswordUrl}">here</a> to reset your password.</p>`,
    });

    if (!mailSent) {
      throw new Error("Failed to send email");
    }

    AuthLogger.logSuccess(
      "password_reset_token_generated",
      "Password reset token generated and email sent",
      email,
      userToReset.id,
      request,
      { tokenId: newToken.id }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    AuthLogger.logFailure(
      "password_reset_error",
      `Password reset request failed: ${errorMessage}`,
      undefined,
      undefined,
      request
    );
    console.error("[Request Reset] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process reset request" },
      { status: 500 }
    );
  }
}
