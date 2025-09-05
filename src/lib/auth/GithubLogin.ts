"use server";

import { signIn } from ".";
import { AuthLogger } from "./logger";

export const GithubLogin = async () => {
  try {
    AuthLogger.logAttempt("github_oauth_login", "Initiating GitHub OAuth login", undefined, undefined, undefined);
    
    const res = await signIn("github", {
      redirectTo: "/dashboard",
    });
    
    AuthLogger.logSuccess("github_oauth_initiated", "GitHub OAuth login initiated successfully", undefined, undefined, undefined);
    return res;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    AuthLogger.logFailure("github_oauth_error", `GitHub OAuth login failed: ${errorMessage}`, undefined, undefined, undefined);
    throw error;
  }
};
