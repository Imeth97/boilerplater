"use server";

import db from "@/db/db";
import { passwordResetToken, user } from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { AuthLogger } from "./logger";

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
    AuthLogger.logAttempt("token_validation", "Validating password reset token", undefined, undefined, undefined, { tokenId });

    if (!tokenId || !token) {
      AuthLogger.logFailure("token_validation", "Missing token ID or token", undefined, undefined, undefined, { tokenId });
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
      AuthLogger.logFailure("token_validation", "Token not found or already used", undefined, undefined, undefined, { tokenId });
      return {
        isValid: false,
        error: "Invalid or already used token",
      };
    }

    // Check if token has expired
    if (tokenRecord.token.expiresAt < new Date()) {
      AuthLogger.logFailure("token_validation", "Token has expired", tokenRecord.user.email, tokenRecord.user.id, undefined, { tokenId, expiresAt: tokenRecord.token.expiresAt });
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
      AuthLogger.logFailure("token_validation", "Invalid token hash", tokenRecord.user.email, tokenRecord.user.id, undefined, { tokenId });
      return {
        isValid: false,
        error: "Invalid token",
      };
    }

    AuthLogger.logSuccess("token_validation", "Token validation successful", tokenRecord.user.email, tokenRecord.user.id, undefined, { tokenId });
    return {
      isValid: true,
      userId: tokenRecord.user.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    AuthLogger.logFailure("token_validation_error", `Token validation failed: ${errorMessage}`, undefined, undefined, undefined, { tokenId });
    console.error("[Token Validation] Error:", error);
    return {
      isValid: false,
      error: "Failed to validate token",
    };
  }
}
