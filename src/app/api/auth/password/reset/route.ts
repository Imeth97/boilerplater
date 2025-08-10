import db from "@/db/db";
import { user, passwordResetToken } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { passwordSchema } from "@/lib/auth/shared.utils";
import { constructHashedPassword } from "@/lib/auth/server.utils";
import { auth } from "@/lib/auth";
import { Logout } from "@/lib/auth/Logout";
import { validatePasswordResetToken } from "@/lib/auth/token-validation";

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

    // Validate the token first
    const validation = await validatePasswordResetToken(tokenId, token);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // Hash the new password
      const hashedPassword = await constructHashedPassword(password);

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
          resetNonce: (userData?.resetNonce || 0) + 1
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