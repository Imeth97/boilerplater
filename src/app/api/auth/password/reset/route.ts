import db from "@/db/db";
import { user, passwordResetToken } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { passwordSchema } from "@/lib/auth/shared.utils";
import { constructHashedPassword } from "@/lib/auth/server.utils";
import { auth } from "@/lib/auth";
import { Logout } from "@/lib/auth/Logout";

export async function POST(request: NextRequest) {
  try {
    const { password, tokenId, token } = await request.json();

    if (!password || !tokenId || !token) {
      return NextResponse.json(
        { success: false, error: "Password, tokenId, and token are required" },
        { status: 400 }
      );
    }

    if (!passwordSchema.safeParse(password).success) {
      return NextResponse.json(
        { success: false, error: "Password is invalid" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // Get the token record with user info
      const tokenRecord = await tx
        .select({
          token: passwordResetToken,
          user: user,
        })
        .from(passwordResetToken)
        .innerJoin(user, eq(passwordResetToken.userId, user.id))
        .where(
          and(
            eq(passwordResetToken.id, tokenId),
            isNull(passwordResetToken.usedAt)
          )
        )
        .then(([record]) => record);

      if (!tokenRecord) {
        throw new Error("Invalid or already used token");
      }

      // Check if token has expired
      if (tokenRecord.token.expiresAt < new Date()) {
        throw new Error("Token has expired");
      }

      // Verify token hash
      const isValidToken = await bcrypt.compare(token, tokenRecord.token.tokenHash);
      if (!isValidToken) {
        throw new Error("Invalid token");
      }

      // Hash the new password
      const hashedPassword = await constructHashedPassword(password);

      // Update password, increment reset nonce, and mark token as used
      await tx
        .update(user)
        .set({ 
          password: hashedPassword,
          resetNonce: (tokenRecord.user.resetNonce || 0) + 1
        })
        .where(eq(user.id, tokenRecord.user.id));

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
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Reset Password] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}