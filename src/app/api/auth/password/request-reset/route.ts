import db from "@/db/db";
import { user, passwordResetToken } from "@/db/schema";
import { sendMail } from "@/lib/email/sendEmail";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
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
      console.error(`[Request Reset] User not found for email: ${email}`);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await db.transaction(async (tx) => {
      // Invalidate any existing unused tokens for this user
      await tx
        .update(passwordResetToken)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetToken.userId, userToReset.id));

      // Generate a new random token
      const plainToken = randomBytes(32).toString("hex");
      const tokenHash = await bcrypt.hash(plainToken, 10);

      // Create new reset token
      const [newToken] = await tx
        .insert(passwordResetToken)
        .values({
          userId: userToReset.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        })
        .returning();

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
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Request Reset] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process reset request" },
      { status: 500 }
    );
  }
}