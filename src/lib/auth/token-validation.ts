"use server";

import db from "@/db/db";
import { passwordResetToken, user } from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  userId?: string;
}

export async function validatePasswordResetToken(
  tokenId: string,
  token: string
): Promise<TokenValidationResult> {
  try {
    if (!tokenId || !token) {
      return {
        isValid: false,
        error: "Token ID and token are required",
      };
    }

    // Get the token record with user info
    const tokenRecord = await db
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
      return {
        isValid: false,
        error: "Invalid or already used token",
      };
    }

    // Check if token has expired
    if (tokenRecord.token.expiresAt < new Date()) {
      return {
        isValid: false,
        error: "Token has expired",
      };
    }

    // Verify token hash
    const isValidToken = await bcrypt.compare(
      token,
      tokenRecord.token.tokenHash
    );
    if (!isValidToken) {
      return {
        isValid: false,
        error: "Invalid token",
      };
    }

    return {
      isValid: true,
      userId: tokenRecord.user.id,
    };
  } catch (error) {
    console.error("[Token Validation] Error:", error);
    return {
      isValid: false,
      error: "Failed to validate token",
    };
  }
}
