"use server";
import { signOut as naSignOut } from ".";
import { AuthLogger } from "./logger";

export async function Logout(redirectTo?: string) {
  try {
    AuthLogger.logAttempt(
      "server_logout",
      "Server-side logout initiated",
      undefined,
      undefined,
      undefined,
      { redirectTo }
    );

    await naSignOut({
      redirect: !!redirectTo,
      redirectTo: redirectTo,
    });

    AuthLogger.logSuccess(
      "server_logout_complete",
      "Server-side logout completed successfully",
      undefined,
      undefined,
      undefined,
      { redirectTo }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    AuthLogger.logFailure(
      "server_logout_error",
      `Server-side logout failed: ${errorMessage}`,
      undefined,
      undefined,
      undefined,
      { redirectTo }
    );
    throw error;
  }
}
