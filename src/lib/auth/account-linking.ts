import db from "@/db/db";
import { account, user } from "@/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import type { Account, Profile } from "next-auth";
import { AdapterAccountType } from "next-auth/adapters";

export interface AccountLinkingResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Find an existing user by email from OAuth profile
 */
export async function findExistingUserByEmail(
  email: string
): Promise<{ id: string; email: string } | null> {
  try {
    const existingUser = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    const result = existingUser[0];
    return result && result.email
      ? { id: result.id, email: result.email }
      : null;
  } catch (error) {
    console.error("Error finding existing user by email:", error);
    return null;
  }
}

/**
 * Check if an account is already linked to a user
 */
export async function isAccountAlreadyLinked(
  provider: string,
  providerAccountId: string
): Promise<boolean> {
  try {
    const existingAccount = await db
      .select({ userId: account.userId })
      .from(account)
      .where(
        and(
          eq(account.provider, provider),
          eq(account.providerAccountId, providerAccountId)
        )
      )
      .limit(1);

    return existingAccount.length > 0;
  } catch (error) {
    console.error("Error checking if account is already linked:", error);
    return false;
  }
}

/**
 * Link OAuth account to existing user while preserving password credentials
 */
export async function linkAccountToExistingUser(
  userId: string,
  accountData: Account
): Promise<AccountLinkingResult> {
  try {
    // Check if this OAuth account is already linked to any user
    const isLinked = await isAccountAlreadyLinked(
      accountData.provider,
      accountData.providerAccountId
    );

    if (isLinked) {
      return {
        success: false,
        error: "OAuth account is already linked to another user",
      };
    }

    // Link the OAuth account to the existing user
    const insertValues: InferInsertModel<typeof account> = {
      userId: userId,
      type: accountData.type as AdapterAccountType,
      provider: accountData.provider,
      providerAccountId: accountData.providerAccountId,
      refresh_token: accountData.refresh_token || null,
      access_token: accountData.access_token || null,
      expires_at: accountData.expires_at || null,
      token_type: accountData.token_type || null,
      scope: accountData.scope || null,
      id_token: accountData.id_token || null,
      session_state: (accountData.session_state as string) || null,
    };

    await db.insert(account).values(insertValues);

    return {
      success: true,
      userId: userId,
    };
  } catch (error) {
    console.error("Error linking account to existing user:", error);
    return {
      success: false,
      error: "Failed to link account to existing user",
    };
  }
}

/**
 * Check if user already has an account with this provider
 */
export async function hasAccountWithProvider(
  userId: string,
  provider: string
): Promise<boolean> {
  try {
    const existingAccount = await db
      .select({ userId: account.userId })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.provider, provider)))
      .limit(1);

    return existingAccount.length > 0;
  } catch (error) {
    console.error("Error checking if user has account with provider:", error);
    return false;
  }
}

/**
 * Handle automatic account linking for OAuth signin attempts
 * Only links when there's a provider mismatch (user exists but with different provider)
 */
export async function handleAccountLinking(
  account: Account,
  profile: Profile
): Promise<AccountLinkingResult> {
  if (!profile.email) {
    return {
      success: false,
      error: "No email provided by OAuth provider",
    };
  }

  // Find existing user with same email
  const existingUser = await findExistingUserByEmail(profile.email);

  if (!existingUser) {
    // No existing user, allow normal account creation
    return {
      success: true,
    };
  }

  // Check if user already has an account with this provider
  const hasThisProvider = await hasAccountWithProvider(
    existingUser.id,
    account.provider
  );

  if (hasThisProvider) {
    // User already has account with this provider - normal login, allow it
    return {
      success: true,
    };
  }

  // User exists but doesn't have this provider - link the accounts
  const linkResult = await linkAccountToExistingUser(existingUser.id, account);

  return linkResult;
}
